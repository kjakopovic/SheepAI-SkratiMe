import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from aws_lambda_powertools import Logger


TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = "eu-central-1"
ITEMS_PER_PAGE = 50


class CategoryNameIndex(GlobalSecondaryIndex):
    """GSI for querying categories by name."""
    class Meta:
        index_name = "category-name-index"
        projection = AllProjection()
        region = AWS_REGION

    name = UnicodeAttribute(hash_key=True)


class CategoryModel(Model):
    """DynamoDB model for categories."""
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    name = UnicodeAttribute()
    name_index = CategoryNameIndex()
    description = UnicodeAttribute(null=True)


logger = Logger(service="CategoryGetLambda")


def handler(event, context):
    """
    Lambda handler for retrieving categories with advanced filtering.

    Query Parameters:
    - id: Single category ID to fetch
    - ids: Comma-separated list of category IDs (e.g., "id1,id2,id3")
    - name: Single category name to fetch
    - names: Comma-separated list of category names (e.g., "Tech,Sports,News")
    - last_evaluated_key: For pagination

    Examples:
    - GET /categories?id=123
    - GET /categories?ids=123,456,789
    - GET /categories?name=Technology
    - GET /categories?names=Technology,Sports,Business
    - GET /categories (returns all, paginated)

    Returns:
        200: Categories retrieved successfully
        404: Category not found (for single ID/name queries)
        500: Internal server error
    """
    logger.info("Received event", extra={"event": event})

    try:
        query_params = event.get("queryStringParameters") or {}

        # Single ID lookup
        single_id = query_params.get("id")
        if single_id:
            logger.debug("Fetching single category by ID", extra={"id": single_id})
            category = CategoryModel.get(single_id)
            return {
                "statusCode": 200,
                "body": json.dumps(category.attribute_values)
            }

        # Multiple IDs lookup
        ids_param = query_params.get("ids")
        if ids_param:
            category_ids = [id.strip() for id in ids_param.split(",") if id.strip()]
            logger.debug("Fetching categories by IDs", extra={"ids": category_ids})

            categories = []
            for category_id in category_ids:
                try:
                    category = CategoryModel.get(category_id)
                    categories.append(category.attribute_values)
                except CategoryModel.DoesNotExist:
                    logger.warning("Category not found", extra={"id": category_id})
                    # Continue to next ID instead of failing
                    continue

            return {
                "statusCode": 200,
                "body": json.dumps({
                    "items": categories,
                    "count": len(categories)
                })
            }

        # Single name lookup
        single_name = query_params.get("name")
        if single_name:
            logger.debug("Fetching category by name", extra={"name": single_name})

            # Query using the name index
            results = list(CategoryModel.name_index.query(single_name, limit=1))

            if not results:
                logger.warning("Category not found", extra={"name": single_name})
                return {
                    "statusCode": 404,
                    "body": json.dumps({"error": "Category not found"})
                }

            return {
                "statusCode": 200,
                "body": json.dumps(results[0].attribute_values)
            }

        # Multiple names lookup
        names_param = query_params.get("names")
        if names_param:
            category_names = [name.strip() for name in names_param.split(",") if name.strip()]
            logger.debug("Fetching categories by names", extra={"names": category_names})

            categories = []
            for category_name in category_names:
                try:
                    results = list(CategoryModel.name_index.query(category_name, limit=1))
                    if results:
                        categories.append(results[0].attribute_values)
                    else:
                        logger.warning("Category not found", extra={"name": category_name})
                except Exception as e:
                    logger.warning("Error querying category", extra={
                        "name": category_name,
                        "error": str(e)
                    })
                    continue

            return {
                "statusCode": 200,
                "body": json.dumps({
                    "items": categories,
                    "count": len(categories)
                })
            }

        # No filters - return all categories (paginated)
        last_evaluated_key = query_params.get("last_evaluated_key")

        scan_kwargs = {"limit": ITEMS_PER_PAGE}
        if last_evaluated_key:
            scan_kwargs["last_evaluated_key"] = json.loads(last_evaluated_key)

        categories = []
        last_key = None

        scan_results = CategoryModel.scan(**scan_kwargs)
        for category in scan_results:
            categories.append(category.attribute_values)

        # Get the last evaluated key for pagination
        if hasattr(scan_results, 'last_evaluated_key') and scan_results.last_evaluated_key:
            last_key = scan_results.last_evaluated_key

        response_body = {
            "items": categories,
            "count": len(categories),
            "last_evaluated_key": json.dumps(last_key) if last_key else None
        }

        return {
            "statusCode": 200,
            "body": json.dumps(response_body)
        }

    except CategoryModel.DoesNotExist:
        logger.warning("Category not found")
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Category not found"})
        }

    except json.JSONDecodeError as e:
        logger.warning("Invalid JSON in last_evaluated_key", extra={"error": str(e)})
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid pagination token"})
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
