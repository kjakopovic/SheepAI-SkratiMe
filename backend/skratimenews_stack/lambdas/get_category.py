import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from aws_lambda_powertools import Logger


CATEGORIES_TABLE_NAME = os.environ["CATEGORIES_TABLE_NAME"]
AWS_REGION = "eu-central-1"
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}


class CategoriesModel(Model):
    class Meta:
        table_name = CATEGORIES_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)

    name = UnicodeAttribute(null=True)


logger = Logger(service="CategoryGetLambda")


def handler(event, context):
    logger.info("Received event", extra={"event": event})

    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        logger.info("OPTIONS preflight request")
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "OK"}),
        }

    try:
        query_params = event.get("queryStringParameters") or {}

        # Single ID lookup
        single_id = query_params.get("id")
        if single_id:
            logger.debug("Fetching single category by ID", extra={"id": single_id})
            category = CategoriesModel.get(single_id)
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps(category.attribute_values),
            }

        # Multiple IDs lookup
        ids_param = query_params.get("ids")
        if ids_param:
            category_ids = [
                cat_id.strip() for cat_id in ids_param.split(",") if cat_id.strip()
            ]
            logger.debug("Fetching categories by IDs", extra={"ids": category_ids})

            categories = []
            missing_ids = set(category_ids)

            for category in CategoriesModel.batch_get(category_ids):
                categories.append(category.attribute_values)
                missing_ids.discard(category.id)

            for missing_id in missing_ids:
                logger.warning("Category not found", extra={"id": missing_id})

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"items": categories}),
            }

        categories = []

        scan_results = CategoriesModel.scan()
        for category in scan_results:
            categories.append(category.attribute_values)

        response_body = {
            "items": categories,
        }

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(response_body),
        }

    except CategoriesModel.DoesNotExist:
        logger.warning("Category not found")
        return {
            "statusCode": 404,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Category not found"}),
        }

    except json.JSONDecodeError as e:
        logger.warning("Invalid JSON in last_evaluated_key", extra={"error": str(e)})
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Invalid pagination token"}),
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
