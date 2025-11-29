import datetime
import json
import os
import re
import uuid

from bs4 import BeautifulSoup
import requests

import boto3
import feedparser

from aws_lambda_powertools import Logger

logger = Logger(service="ScrapeWebLambda", level="INFO")

RSS_URL = os.environ.get("RSS_URL", "https://feeds.feedburner.com/TheHackersNews")
TRACKING_TABLE_NAME = os.environ["TABLE_NAME"]
NEWS_TABLE_NAME = os.environ["NEWS_TABLE_NAME"]
CATEGORIES_TABLE_NAME = os.environ["CATEGORIES_TABLE_NAME"]
AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.titan-text-lite-v1")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
tracking_table = dynamodb.Table(TRACKING_TABLE_NAME)
news_table = dynamodb.Table(NEWS_TABLE_NAME)
categories_table = dynamodb.Table(CATEGORIES_TABLE_NAME)
bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)


def lambda_handler(event, context):
    logger.info("Lambda invoked", extra={"event": event})

    last_scrape_time = _load_last_scrape()
    feed = _fetch_feed()

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tracking_table.put_item(
        Item={"last_scrape": "last_scrape", "scraped_at": timestamp}
    )
    logger.info("Updated last scrape timestamp", extra={"scraped_at": timestamp})

    categories = _load_categories()
    category_names = [cat["name"] for cat in categories if cat.get("name")]
    category_lookup = {
        cat["name"].lower(): cat["id"]
        for cat in categories
        if cat.get("id") and cat.get("name")
    }
    logger.info("Prepared category data", extra={"count": len(category_names)})

    processed = 0
    skipped_old = 0
    failed = 0

    for idx, entry in enumerate(feed.entries, start=1):
        logger.info(
            "Processing entry", extra={"index": idx, "title": entry.get("title")}
        )
        published_at = entry.get("published")
        published_dt_utc = _to_utc(published_at)

        if (
            last_scrape_time
            and published_dt_utc
            and published_dt_utc <= last_scrape_time
        ):
            skipped_old += 1
            logger.info(
                "Skipping older entry",
                extra={
                    "title": entry.get("title"),
                    "published_at": published_at,
                    "last_scrape": last_scrape_time.isoformat(),
                },
            )
            continue

        summary = entry.get("summary", "No Summary")
        category_id = categorize_summary(summary, category_names, category_lookup)

        news_item = {
            "id": str(uuid.uuid4()),
            "title": entry.get("title", "No Title"),
            "summary": summary,
            "category_id": category_id,
            "picture_url": _extract_image(entry.get("links", [])),
            "news_link": entry.get("link", "No Link"),
            "published_at": published_dt_utc.isoformat() if published_dt_utc else None,
            "author": entry.get("author", "Unknown Author"),
            "full_article": _build_full_article(entry.get("link", "")),
        }

        try:
            news_table.put_item(Item=news_item)
            processed += 1
            logger.info(
                "Saved news item",
                extra={"title": news_item["title"], "category_id": category_id},
            )
        except Exception as exc:
            failed += 1
            logger.error(
                "Failed to save news item",
                extra={"error": str(exc), "news_id": news_item["id"]},
            )

    logger.info(
        "Scrape completed",
        extra={
            "processed": processed,
            "skipped_old": skipped_old,
            "failed": failed,
            "total_entries": len(feed.entries),
        },
    )

    return {
        "statusCode": 200,
        "body": json.dumps({"processed": processed, "skipped": skipped_old}),
    }


def _load_last_scrape():
    try:
        response = tracking_table.get_item(Key={"last_scrape": "last_scrape"})
        item = response.get("Item")
        if not item:
            logger.info("No previous scrape timestamp found")
            return None
        last_scrape_time = datetime.datetime.fromisoformat(item["scraped_at"])
        logger.info(
            "Loaded last scrape timestamp", extra={"timestamp": item["scraped_at"]}
        )
        tracking_table.delete_item(Key={"last_scrape": "last_scrape"})
        logger.info("Cleared previous scrape record")
        return last_scrape_time
    except Exception as exc:
        logger.warning(
            "Failed to load last scrape timestamp", extra={"error": str(exc)}
        )
        return None


def _fetch_feed():
    logger.info("Fetching RSS feed", extra={"url": RSS_URL})
    feed = feedparser.parse(RSS_URL)
    if feed.bozo:
        raise RuntimeError(f"RSS parse error: {feed.bozo_exception}")
    logger.info("RSS feed fetched", extra={"entries": len(feed.entries)})
    return feed


def _load_categories():
    items = []
    try:
        response = categories_table.scan()
        items.extend(response.get("Items", []))
        while "LastEvaluatedKey" in response:
            response = categories_table.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))
        logger.info("Loaded categories", extra={"count": len(items)})
    except Exception as exc:
        logger.error("Failed to load categories", extra={"error": str(exc)})
    return items


def categorize_summary(summary, category_names, category_lookup):
    if not summary:
        logger.warning("Summary missing; defaulting category")
        return "uncategorized"
    if not category_names:
        logger.warning("No categories available; defaulting category")
        return "uncategorized"

    prompt = (
        "You are a news categorization assistant. "
        "Respond with exactly one category (maximum two words) chosen from this list: "
        f"{', '.join(category_names)}. "
        f"Summary: {summary}\nCategory:"
    )

    body = json.dumps(
        {
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": 20,
                "temperature": 0.2,
                "topP": 0.9,
            },
        }
    )

    try:
        response = bedrock.invoke_model(modelId=BEDROCK_MODEL_ID, body=body)
        payload = json.loads(response["body"].read())
        raw_output = payload.get("results", [{}])[0].get("outputText", "").strip()
        logger.info("Bedrock response", extra={"raw_output": raw_output})
    except Exception as exc:
        logger.error("Bedrock invocation failed", extra={"error": str(exc)})
        return "uncategorized"

    cleaned = re.sub(r"[^A-Za-z0-9\s-]", "", raw_output).strip().lower()
    if not cleaned:
        logger.warning("Bedrock response empty after cleaning; defaulting")
        return "uncategorized"

    category_id = category_lookup.get(cleaned)
    if category_id:
        logger.info(
            "Matched category", extra={"cleaned": cleaned, "category_id": category_id}
        )
        return category_id

    logger.warning("No category match found", extra={"cleaned": cleaned})
    return "uncategorized"


def _to_utc(published_at):
    if not published_at:
        logger.info("Entry missing published date; treating as None")
        return None
    try:
        published_dt = datetime.datetime.strptime(
            published_at, "%a, %d %b %Y %H:%M:%S %z"
        )
        utc_dt = published_dt.astimezone(datetime.timezone.utc)
        logger.info(
            "Parsed published date",
            extra={"input": published_at, "utc": utc_dt.isoformat()},
        )
        return utc_dt
    except ValueError:
        logger.warning("Failed to parse published date", extra={"value": published_at})
        return None


def _extract_image(links):
    for link in links or []:
        if link.get("type", "").startswith("image/"):
            logger.info("Found image link", extra={"href": link.get("href")})
            return link.get("href")
    logger.info("No image link found for entry")
    return None


def _build_full_article(url):
    if url == "":
        return ""

    # Fetch the HTML content
    response = requests.get(url)
    response.raise_for_status()

    # Parse HTML
    soup = BeautifulSoup(response.text, "html.parser")

    # Get the article body div
    article_div = soup.find("div", id="articlebody")

    if not article_div:
        return {"statusCode": 404, "body": json.dumps("Article body not found")}

    # Remove unwanted divs
    for div in article_div.find_all("div", class_=["dog_two", "separator"]):
        div.decompose()

    # Extract text
    article_text = article_div.get_text(separator="\n", strip=True)

    return article_text
