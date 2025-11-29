import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from aws_lambda_powertools import Logger


TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = "eu-central-1"


class CategoryModel(Model):
    """DynamoDB model for categories."""
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)


logger = Logger(service="CategoryDeleteLambda")


def handler(event, context):
    """
    Lambda handler for deleting a category.

    Path Parameters:
    - id: Category ID to delete

    Returns:
        200: Category deleted successfully
        404: Category not found
        500: Internal server error

    Note: This performs a soft delete. Consider implementing a check to prevent
    deletion of categories that are currently associated with news items.
    """
    logger.info("Received event", extra={"event": event})

    try:
        # Get category ID from path
        path_params = event.get("pathParameters") or {}
        category_id = path_params.get("id")

        if not category_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Category ID is required"})
            }

        logger.debug("Attempting to delete category", extra={"id": category_id})

        # Fetch and delete category
        category = CategoryModel.get(category_id)
        logger.info("Fetched category from database", extra={"category": category.attribute_values})

        category.delete()
        logger.info("Deleted category from database", extra={"id": category_id})

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Category deleted successfully",
                "id": category_id
            })
        }

    except CategoryModel.DoesNotExist:
        logger.warning("Category not found", extra={"id": category_id})
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Category not found"})
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
