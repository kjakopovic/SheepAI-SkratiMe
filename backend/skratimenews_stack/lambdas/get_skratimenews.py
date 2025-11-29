import os
import json
from boto3.dynamodb.conditions import Key
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from aws_lambda_powertools import Logger
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.attributes import UnicodeAttribute

ITEMS_PER_PAGE = 10
TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = "eu-central-1"


class CategoryIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "news-category-index"
        projection = AllProjection()
        region = AWS_REGION

    category_id = UnicodeAttribute(hash_key=True)


class SkratimenewsModel(Model):
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)

    title = UnicodeAttribute(null=True)

    summary = UnicodeAttribute(null=True)

    category_id = UnicodeAttribute(null=True)
    category_index = CategoryIndex()

    picture_url = UnicodeAttribute(null=True)


logger = Logger(service="SkratimenewsGetLambda")


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}


def handler(event, context):
    logger.info("Received event", extra={"event": event})

    try:
        query_params = event.get("queryStringParameters") or {}
        item_id = query_params.get("id")
        category_id = query_params.get("category_id", None)
        last_evaluated_key = query_params.get("last_evaluated_key")

        if item_id:
            # Fetch single item by id
            logger.debug("Fetching single item", extra={"id": item_id})
            item = SkratimenewsModel.get(item_id)
            response_body = item.attribute_values.copy()

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps(response_body),
            }
        if category_id:
            # Query using news-category-index
            query_kwargs = {
                "Index": "news-category-index",
                "KeyConditionExpression": Key("category_id").eq(category_id),
                "Limit": ITEMS_PER_PAGE,
            }

            if last_evaluated_key:
                query_kwargs["ExclusiveStartKey"] = json.loads(last_evaluated_key)

            items = []
            last_key = None

            query = SkratimenewsModel.category_index.query(
                category_id,
                limit=ITEMS_PER_PAGE,
                last_evaluated_key=(
                    json.loads(last_evaluated_key) if last_evaluated_key else None
                ),
            )

            for item in query:
                items.append(item.attribute_values.copy())

            last_key = query.last_evaluated_key

            response_body = {
                "items": items,
                "last_evaluated_key": json.dumps(last_key) if last_key else None,
            }
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps(response_body),
            }
        else:
            # Paginated scan
            scan_kwargs = {}
            scan_kwargs["limit"] = ITEMS_PER_PAGE
            if last_evaluated_key:
                scan_kwargs["exclusive_start_key"] = json.loads(last_evaluated_key)

            items = []
            last_key = None
            for item in SkratimenewsModel.scan(**scan_kwargs):
                item_data = item.attribute_values.copy()

                items.append(item_data)

            if hasattr(item, "last_evaluated_key") and item.last_evaluated_key:
                last_key = item.last_evaluated_key

            response_body = {
                "items": items,
                "last_evaluated_key": json.dumps(last_key) if last_key else None,
            }

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps(response_body),
            }

    except SkratimenewsModel.DoesNotExist:
        logger.warning("Item not found", extra={"id": item_id})
        return {
            "statusCode": 404,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Item not found"}),
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
