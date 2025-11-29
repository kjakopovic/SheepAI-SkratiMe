import datetime
import json
import os
import uuid

import boto3
import feedparser
import requests
from aws_lambda_powertools import Logger
from bs4 import BeautifulSoup

logger = Logger(service="ScrapeWebLambda", level="INFO")

RSS_URL = os.environ.get("RSS_URL", "https://feeds.feedburner.com/TheHackersNews")
TABLE_NAME = os.environ["TABLE_NAME"]
QUEUE_URL = os.environ["RSS_QUEUE_URL"]
AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
tracking_table = dynamodb.Table(TABLE_NAME)
sqs = boto3.client("sqs", region_name=AWS_REGION)


def lambda_handler(event, context):
    logger.info("Lambda invoked", extra={"event": event})

    last_scrape_time = _load_last_scrape()
    feed = _fetch_feed()

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tracking_table.put_item(
        Item={"last_scrape": "last_scrape", "scraped_at": timestamp}
    )
    logger.info("Updated last scrape timestamp", extra={"scraped_at": timestamp})

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
                "Skipping previously processed item",
                extra={
                    "title": entry.get("title"),
                    "published_at": published_at,
                    "last_scrape": last_scrape_time.isoformat(),
                },
            )
            continue

        payload = {
            "id": str(uuid.uuid4()),
            "title": entry.get("title", "No Title"),
            "summary": entry.get("summary", "No Summary"),
            "news_link": entry.get("link", "No Link"),
            "author": entry.get("author", "Unknown Author"),
            "published_at": published_at,
            "published_at_utc": (
                published_dt_utc.isoformat() if published_dt_utc else None
            ),
            "picture_url": _extract_image(entry.get("links", [])),
            "full_article": scrape_full_article_from_url(entry.get("link", "")),
        }

        try:
            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(payload),
                MessageGroupId="rss",
            )
            processed += 1
            logger.info("Queued news item", extra={"title": payload["title"]})
        except Exception as exc:
            failed += 1
            logger.error(
                "Failed to enqueue news item",
                extra={"error": str(exc), "title": payload["title"]},
            )

    logger.info(
        "Scrape completed",
        extra={
            "queued": processed,
            "skipped_old": skipped_old,
            "failed": failed,
            "total_entries": len(feed.entries),
        },
    )
    return {
        "statusCode": 200,
        "body": json.dumps({"queued": processed, "skipped": skipped_old}),
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
            "Loaded last scrape timestamp",
            extra={"timestamp": item["scraped_at"]},
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


def _to_utc(published_at):
    if not published_at:
        return None
    try:
        published_dt = datetime.datetime.strptime(
            published_at, "%a, %d %b %Y %H:%M:%S %z"
        )
        return published_dt.astimezone(datetime.timezone.utc)
    except ValueError:
        logger.warning("Failed to parse published date", extra={"value": published_at})
        return None


def _extract_image(links):
    for link in links or []:
        if link.get("type", "").startswith("image/"):
            return link.get("href")
    return None


def scrape_full_article_from_url(url: str) -> str:
    if not url:
        return ""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except Exception as exc:
        logger.warning(
            "Failed to fetch article body", extra={"url": url, "error": str(exc)}
        )
        return ""

    soup = BeautifulSoup(response.text, "html.parser")
    article_div = soup.find("div", id="articlebody")
    if not article_div:
        logger.info("Article body not found", extra={"url": url})
        return ""

    for div in article_div.find_all("div", class_=["dog_two", "separator"]):
        div.decompose()

    return article_div.get_text(separator="\n", strip=True)
