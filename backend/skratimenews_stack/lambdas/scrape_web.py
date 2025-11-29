import datetime
import json
import os
import uuid

from bs4 import BeautifulSoup
import requests
import boto3
import feedparser
from aws_lambda_powertools import Logger
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute


logger = Logger(service="ScrapeWebLambda")

sqs = boto3.client("sqs")
QUEUE_URL = os.environ["RSS_QUEUE_URL"]
RSS_URL = "https://feeds.feedburner.com/TheHackersNews"
TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = "eu-central-1"


class ScrapeTrackingModel(Model):
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    last_scrape = UnicodeAttribute(hash_key=True, default="last_scrape")
    scraped_at = UnicodeAttribute()


def lambda_handler(event, context):
    try:
        logger.info("Fetching RSS feed: %s", RSS_URL)

        # Get last scrape time
        last_scrape_records = list(ScrapeTrackingModel.scan())
        last_scrape_time = (
            last_scrape_records[0].scraped_at if last_scrape_records else None
        )

        last_scrape_time_utc = None
        if last_scrape_time:
            last_scrape_time_utc = datetime.datetime.fromisoformat(last_scrape_time)

        # Delete old records
        for record in last_scrape_records:
            record.delete()

        feed = feedparser.parse(RSS_URL)

        if feed.bozo:
            logger.error("Failed to parse RSS: %s", feed.bozo_exception)
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "Failed to read RSS feed"}),
            }

        # Scrape time saving
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        scrape_record = ScrapeTrackingModel(
            last_scrape=str(uuid.uuid4()), scraped_at=timestamp
        )
        scrape_record.save()

        news = feed.entries
        for entry in news:
            published_at = entry.get("published", None)
            published_dt_utc = None
            if published_at:
                try:
                    published_dt = datetime.datetime.strptime(
                        published_at, "%a, %d %b %Y %H:%M:%S %z"
                    )
                    published_dt_utc = published_dt.astimezone(datetime.timezone.utc)
                except ValueError:
                    logger.debug(
                        "Unable to parse published date",
                        extra={"published": published_at},
                    )

            if (
                last_scrape_time_utc
                and published_dt_utc
                and published_dt_utc <= last_scrape_time_utc
            ):
                logger.debug(
                    "Skipping previously processed item",
                    extra={"title": entry.get("title"), "published": published_at},
                )
                continue

            title = entry.get("title", "No Title")
            summary = entry.get("summary", "No Summary")
            news_link = entry.get("link", "No Link")
            author = entry.get("author", "Unknown Author")
            links = entry.get("links", [])
            full_article = scrape_full_article_from_url(news_link)
            picture_url = None
            for link in links:
                if link.get("type", "").startswith("image/"):
                    picture_url = link.get("href")
                    break

            item = {
                "title": title,
                "summary": summary,
                "news_link": news_link,
                "author": author,
                "published_at": published_at,
                "published_at_utc": (
                    published_dt_utc.isoformat() if published_dt_utc else None
                ),
                "picture_url": picture_url,
                "full_article": full_article,
            }
            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(item),
                MessageGroupId="rss",  # omit if queue is standard
            )

            logger.info("Extracted news item")

        logger.info(
            "Successfully fetched RSS feed with entries",
            extra={"feed_info": json.dumps({"source": RSS_URL}, default=str)},
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"source": RSS_URL}, default=str),
        }

    except Exception as e:
        logger.error("Error fetching RSS feed: %s", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"}),
        }


def scrape_full_article_from_url(url: str) -> str:
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
