import os
import base64
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from pydantic import BaseModel, ValidationError
from aws_lambda_powertools import Logger


TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = "eu-central-1"


class CategoryModel(Model):
    """DynamoDB model for categories."""
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    name = UnicodeAttribute()
    description = UnicodeAttribute(null=True)


class UpdateCategorySchema(BaseModel):
    """Validation schema for updating a category."""
    name: str | None = None
    description: str | None = None


logger = Logger(service="CategoryUpdateLambda")


def handler(event, context):
    """
    Lambda handler for updating an existing category.

    Path Parameters:
    - id: Category ID to update

    Expected request body (all fields optional):
    {
        "name": "Updated Technology",
        "description": "Updated description"
    }

    Returns:
        200: Category updated successfully
        400: Validation error
        404: Category not found
        409: Category name already exists (if updating name)
        500: Internal server error
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

        # Parse body
        body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            body = base64.b64decode(body).decode("utf-8")
            logger.debug("Decoded base64 body", extra={"body": body})

        payload = json.loads(body)
        logger.debug("Parsed JSON payload", extra={"payload": payload})

        # Validate payload
        data = UpdateCategorySchema(**payload)
        logger.info("Payload validated against schema")

        # Fetch existing category
        category = CategoryModel.get(category_id)
        logger.info("Fetched existing category", extra={"id": category_id})

        # Check if new name conflicts with existing category
        if data.name is not None and data.name != category.name:
            try:
                existing = list(CategoryModel.scan(CategoryModel.name == data.name, limit=1))
                if existing:
                    logger.warning("Category with name already exists", extra={"name": data.name})
                    return {
                        "statusCode": 409,
                        "body": json.dumps({
                            "error": f"Category with name '{data.name}' already exists"
                        })
                    }
            except Exception as e:
                logger.warning("Error checking for existing category", extra={"error": str(e)})

        # Update fields
        if data.name is not None:
            category.name = data.name
            logger.debug("Updated name field")

        if data.description is not None:
            category.description = data.description
            logger.debug("Updated description field")

        # Save to DynamoDB
        category.save()
        logger.info("Category updated successfully")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Category updated successfully",
                "category": category.attribute_values
            })
        }

    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

    except CategoryModel.DoesNotExist:
        logger.warning("Category not found", extra={"id": category_id})
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Category not found"})
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
