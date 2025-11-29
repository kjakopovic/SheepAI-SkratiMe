import json
import os
import re
import uuid

import boto3
from aws_lambda_powertools import Logger

logger = Logger(service="CategorizerLambda", level="INFO")

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.titan-text-lite-v1")
AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")
NEWS_TABLE_NAME = os.environ["NEWS_TABLE_NAME"]
CATEGORIES_TABLE_NAME = os.environ["CATEGORIES_TABLE_NAME"]

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
news_table = dynamodb.Table(NEWS_TABLE_NAME)
categories_table = dynamodb.Table(CATEGORIES_TABLE_NAME)
bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)


def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info("Received records", extra={"count": len(records)})

    categories = _load_categories()
    if not categories:
        logger.warning("No categories loaded; all items default to uncategorized")

    category_names = [cat["name"] for cat in categories if cat.get("name")]
    category_lookup = {
        cat["name"].lower(): cat["id"]
        for cat in categories
        if cat.get("id") and cat.get("name")
    }

    processed = 0
    failed = 0

    for idx, record in enumerate(records):
        logger.info("Processing record", extra={"record_index": idx})
        payload = _parse_payload(record)
        if not payload:
            failed += 1
            continue

        category_id = categorize_summary(
            payload.get("summary", ""),
            category_names,
            category_lookup,
        )

        news_item = {
            "id": str(uuid.uuid4()),
            "title": payload.get("title", ""),
            "summary": payload.get("summary", ""),
            "category_id": category_id,
            "picture_url": payload.get("picture_url", ""),
            "news_link": payload.get("news_link", ""),
            "published_at": payload.get("published_at_utc", ""),
            "author": payload.get("author", ""),
            "full_article": payload.get("full_article", ""),
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
        "Categorizer finished",
        extra={"processed": processed, "failed": failed},
    )
    return {"statusCode": 200}


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


def _parse_payload(record):
    body = record.get("body")
    if not body:
        logger.error("Record missing body", extra={"record": record})
        return None
    try:
        payload = json.loads(body)
        logger.info("Parsed payload", extra={"title": payload.get("title")})
        return payload
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON payload", extra={"error": str(exc), "body": body})
        return None


def categorize_summary(summary, category_names, category_lookup):
    if not summary:
        logger.warning("Empty summary; defaulting category")
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

    return normalize_category(raw_output, category_lookup)


def normalize_category(text, category_lookup):
    if not text:
        logger.warning("Empty category text; defaulting")
        return "uncategorized"

    cleaned = re.sub(r"[^A-Za-z0-9\s-]", "", text).strip().lower()
    if not cleaned:
        logger.warning("Category text sanitized to empty; defaulting")
        return "uncategorized"

    category_id = category_lookup.get(cleaned)
    if category_id:
        logger.info(
            "Matched category",
            extra={"normalized_text": cleaned, "category_id": category_id},
        )
        return category_id

    logger.warning("Category not found; defaulting", extra={"normalized_text": cleaned})
    return "uncategorized"
