import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, UTCDateTimeAttribute
from aws_lambda_powertools import Logger

TABLE_NAME = os.environ["BOOKMARKS_TABLE_NAME"]
AWS_REGION = "eu-central-1"

logger = Logger(service="RemoveBookmarkLambda")


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

        # Get news_id from path parameters
        news_id = event["pathParameters"]["news_id"]

        if not news_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "news_id is required"}),
            }

        # Try to delete the bookmark
        try:
            bookmark = UserBookmarkModel.get(user_id, news_id)
            bookmark.delete()
            logger.info("Bookmark deleted successfully", extra={"user_id": user_id, "news_id": news_id})

            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Bookmark removed successfully"}),
            }
        except UserBookmarkModel.DoesNotExist:
            logger.warning("Bookmark not found", extra={"user_id": user_id, "news_id": news_id})
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "Bookmark not found"}),
            }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
