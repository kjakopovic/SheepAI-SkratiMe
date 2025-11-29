import json
import os
import re
import uuid

import boto3
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from aws_lambda_powertools import Logger

logger = Logger(service="CategorizerLambda", level="INFO")

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.titan-text-lite-v1")
AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")
NEWS_TABLE_NAME = os.environ.get("NEWS_TABLE_NAME", "SkratimenewsTable")
CATEGORIES_TABLE_NAME = os.environ.get("CATEGORIES_TABLE_NAME", "CategoriesTable")

bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)


class SkratimenewsModel(Model):
    class Meta:
        table_name = NEWS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    title = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    category_id = UnicodeAttribute(null=True)
    picture_url = UnicodeAttribute(null=True)
    news_link = UnicodeAttribute(null=True)
    published_at = UnicodeAttribute(null=True)
    author = UnicodeAttribute(null=True)
    full_article = UnicodeAttribute(null=True)


class CategoriesModel(Model):
    class Meta:
        table_name = CATEGORIES_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    name = UnicodeAttribute(null=True)


def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info("Received records", extra={"count": len(records), "records": records})

    try:
        categories = list(CategoriesModel.scan())
        category_names = [cat.name for cat in categories if cat.name]
        category_lookup = {
            cat.name.lower(): cat.id for cat in categories if cat.id and cat.name
        }
        logger.info(
            "Loaded categories",
            extra={"total": len(category_names), "names": category_names},
        )
    except Exception as exc:
        logger.error("Failed to load categories", extra={"error": str(exc)})
        raise

    for idx, record in enumerate(records):
        logger.info("Processing record", extra={"record_index": idx})
        payload = _parse_payload(record)
        if not payload:
            continue

        category_id = categorize_summary(
            payload.get("summary", ""), category_names, category_lookup
        )
        logger.info(
            "Categorized news item",
            extra={
                "title": payload.get("title"),
                "category_id": category_id,
                "published_at": payload.get("published_at"),
            },
        )

        try:
            news_id = str(uuid.uuid4())
            news_item = SkratimenewsModel(
                id=news_id,
                title=payload.get("title", ""),
                summary=payload.get("summary", ""),
                category_id=category_id,
                picture_url=payload.get("picture_url", ""),
                news_link=payload.get("news_link", ""),
                published_at=payload.get("published_at_utc", ""),
                author=payload.get("author", ""),
                full_article=payload.get("full_article", ""),
            )
            logger.info("Saving news item 2", extra={"news": news_item})
            news_item.save()
            logger.info("News item saved 2", extra={"news": news_item})
        except Exception as exc:
            logger.error(
                "Failed to save news item",
                extra={"error": str(exc), "payload": payload},
            )

    logger.info("Categorizer Lambda finished")
    return {"statusCode": 200}


def _parse_payload(record):
    try:
        body = record.get("body") or "{}"
        payload = json.loads(body)
        logger.info("Parsed payload", extra={"title": payload.get("title")})
        return payload
    except json.JSONDecodeError as exc:
        logger.error(
            "Invalid JSON payload",
            extra={"error": str(exc), "raw_body": record.get("body")},
        )
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
        response_payload = json.loads(response["body"].read())
        raw_output = (
            response_payload.get("results", [{}])[0].get("outputText", "").strip()
        )
        logger.info("Bedrock responded", extra={"raw_output": raw_output})
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
