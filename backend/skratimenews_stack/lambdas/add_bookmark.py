import os
import json
from datetime import datetime
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, UTCDateTimeAttribute
from aws_lambda_powertools import Logger

TABLE_NAME = os.environ["BOOKMARKS_TABLE_NAME"]
AWS_REGION = "eu-central-1"

logger = Logger(service="AddBookmarkLambda")


class UserBookmarkModel(Model):
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    user_id = UnicodeAttribute(hash_key=True)
    news_id = UnicodeAttribute(range_key=True)
    created_at = UTCDateTimeAttribute()


def handler(event, context):
    logger.info("Received event", extra={"event": event})

    try:
        # Extract user ID from Cognito authorizer context
        user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
        logger.info("User ID extracted", extra={"user_id": user_id})

        # Parse request body
        body = json.loads(event.get("body", "{}"))
        news_id = body.get("news_id")

        if not news_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "news_id is required"}),
            }

        # Check if bookmark already exists
        try:
            existing_bookmark = UserBookmarkModel.get(user_id, news_id)
            logger.info("Bookmark already exists", extra={"user_id": user_id, "news_id": news_id})
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Bookmark already exists"}),
            }
        except UserBookmarkModel.DoesNotExist:
            # Bookmark doesn't exist, create it
            pass

        # Create bookmark
        bookmark = UserBookmarkModel(
            user_id=user_id,
            news_id=news_id,
            created_at=datetime.utcnow(),
        )
        bookmark.save()

        logger.info("Bookmark created successfully", extra={"user_id": user_id, "news_id": news_id})

        return {
            "statusCode": 201,
            "body": json.dumps({
                "message": "Bookmark added successfully",
                "user_id": user_id,
                "news_id": news_id
            }),
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
