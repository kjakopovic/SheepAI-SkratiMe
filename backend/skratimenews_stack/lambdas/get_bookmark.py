import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, UTCDateTimeAttribute
from aws_lambda_powertools import Logger

BOOKMARKS_TABLE_NAME = os.environ["BOOKMARKS_TABLE_NAME"]
NEWS_TABLE_NAME = os.environ["NEWS_TABLE_NAME"]
AWS_REGION = "eu-central-1"

logger = Logger(service="GetBookmarksLambda")


class UserBookmarkModel(Model):
    class Meta:
        table_name = BOOKMARKS_TABLE_NAME
        region = AWS_REGION

    user_id = UnicodeAttribute(hash_key=True)
    news_id = UnicodeAttribute(range_key=True)
    created_at = UTCDateTimeAttribute()


class SkratimenewsModel(Model):
    class Meta:
        table_name = NEWS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    title = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    category_id = UnicodeAttribute(null=True)
    picture_url = UnicodeAttribute(null=True)


def handler(event, context):
    logger.info("Received event", extra={"event": event})

    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        logger.info("OPTIONS preflight request")
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": event.get("headers", {}).get(
                    "origin", "*"
                ),
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
            "body": json.dumps({"message": "OK"}),
        }

    try:
        # Extract user ID from Cognito authorizer context
        user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
        logger.info("User ID extracted", extra={"user_id": user_id})

        # Query all bookmarks for this user
        bookmarks = list(UserBookmarkModel.query(user_id))
        logger.info(
            f"Found {len(bookmarks)} bookmarks",
            extra={"user_id": user_id, "count": len(bookmarks)},
        )

        # Get news details for each bookmark
        bookmarked_news = []
        for bookmark in bookmarks:
            try:
                news_item = SkratimenewsModel.get(bookmark.news_id)
                bookmarked_news.append(
                    {
                        "id": news_item.id,
                        "title": news_item.title,
                        "summary": news_item.summary,
                        "category_id": news_item.category_id,
                        "picture_url": news_item.picture_url,
                        "bookmarked_at": (
                            bookmark.created_at.isoformat()
                            if bookmark.created_at
                            else None
                        ),
                    }
                )
            except SkratimenewsModel.DoesNotExist:
                logger.warning(
                    f"News item not found for bookmark",
                    extra={"news_id": bookmark.news_id},
                )
                # Skip this bookmark if news was deleted
                continue

        return {
            "statusCode": 200,
            "body": json.dumps(
                {"bookmarks": bookmarked_news, "count": len(bookmarked_news)}
            ),
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
