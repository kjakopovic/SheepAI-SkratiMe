import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from aws_lambda_powertools import Logger


CATEGORIES_TABLE_NAME = os.environ["CATEGORIES_TABLE_NAME"]
NEWS_TABLE_NAME = os.environ["NEWS_TABLE_NAME"]
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
        table_name = CATEGORIES_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    name = UnicodeAttribute()
    name_index = CategoryNameIndex()
    description = UnicodeAttribute(null=True)


class NewsCategoryIndex(GlobalSecondaryIndex):
    """GSI for querying news by category."""
    class Meta:
        index_name = "news-category-index"
        projection = AllProjection()
        region = AWS_REGION

    category_id = UnicodeAttribute(hash_key=True)


class NewsModel(Model):
    """DynamoDB model for news items."""
    class Meta:
        table_name = NEWS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    title = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    category_id = UnicodeAttribute(null=True)
    category_index = NewsCategoryIndex()
    picture_url = UnicodeAttribute(null=True)


logger = Logger(service="GetNewsByCategoriesLambda")


def handler(event, context):
    """
    Lambda handler for retrieving news items filtered by categories.

    Query Parameters:
    - category_ids: Comma-separated list of category IDs (e.g., "id1,id2,id3")
    - category_names: Comma-separated list of category names (e.g., "Tech,Sports")
    - limit: Maximum number of news items per category (default: 50)

    Examples:
    - GET /news-by-categories?category_ids=123,456
    - GET /news-by-categories?category_names=Technology,Sports
    - GET /news-by-categories?category_ids=123&limit=10

    Returns:
        200: News items retrieved successfully
        400: Invalid request (no category filter provided)
        500: Internal server error

    Response format:
    {
        "categories": {
            "category_id_1": {
                "category": {"id": "...", "name": "...", "description": "..."},
                "news": [...],
                "count": 10
            },
            "category_id_2": {
                "category": {"id": "...", "name": "...", "description": "..."},
                "news": [...],
                "count": 5
            }
        },
        "total_news_count": 15
    }
    """
    logger.info("Received event", extra={"event": event})

    try:
        query_params = event.get("queryStringParameters") or {}

        # Get limit for news per category
        try:
            limit = int(query_params.get("limit", ITEMS_PER_PAGE))
            limit = min(limit, ITEMS_PER_PAGE)  # Cap at max items per page
        except ValueError:
            limit = ITEMS_PER_PAGE

        category_ids = []

        # Get category IDs from query parameter
        ids_param = query_params.get("category_ids")
        if ids_param:
            category_ids.extend([id.strip() for id in ids_param.split(",") if id.strip()])
            logger.debug("Received category IDs", extra={"ids": category_ids})

        # Get category IDs from names
        names_param = query_params.get("category_names")
        if names_param:
            category_names = [name.strip() for name in names_param.split(",") if name.strip()]
            logger.debug("Received category names", extra={"names": category_names})

            # Resolve category names to IDs
            for category_name in category_names:
                try:
                    results = list(CategoryModel.name_index.query(category_name, limit=1))
                    if results:
                        category_ids.append(results[0].id)
                        logger.debug("Resolved category name to ID", extra={
                            "name": category_name,
                            "id": results[0].id
                        })
                    else:
                        logger.warning("Category not found by name", extra={"name": category_name})
                except Exception as e:
                    logger.warning("Error resolving category name", extra={
                        "name": category_name,
                        "error": str(e)
                    })

        # Validate we have at least one category filter
        if not category_ids:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "At least one category filter (category_ids or category_names) is required"
                })
            }

        # Remove duplicates
        category_ids = list(set(category_ids))
        logger.info("Processing categories", extra={"category_ids": category_ids})

        # Fetch news for each category
        result = {
            "categories": {},
            "total_news_count": 0
        }

        for category_id in category_ids:
            try:
                # Fetch category details
                category = CategoryModel.get(category_id)
                category_data = category.attribute_values

                # Query news items for this category using GSI
                news_items = []
                news_query = NewsModel.category_index.query(
                    category_id,
                    limit=limit
                )

                for news_item in news_query:
                    news_items.append(news_item.attribute_values)

                # Add to result
                result["categories"][category_id] = {
                    "category": category_data,
                    "news": news_items,
                    "count": len(news_items)
                }

                result["total_news_count"] += len(news_items)

                logger.debug("Fetched news for category", extra={
                    "category_id": category_id,
                    "news_count": len(news_items)
                })

            except CategoryModel.DoesNotExist:
                logger.warning("Category not found", extra={"id": category_id})
                # Continue processing other categories
                continue

            except Exception as e:
                logger.warning("Error fetching news for category", extra={
                    "category_id": category_id,
                    "error": str(e)
                })
                # Continue processing other categories
                continue

        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
