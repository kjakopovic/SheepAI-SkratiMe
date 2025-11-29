import os
import base64
import json
import uuid
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


class CreateCategorySchema(BaseModel):
    """Validation schema for creating a category."""
    name: str
    description: str | None = None


logger = Logger(service="CategoryCreateLambda")


def handler(event, context):
    """
    Lambda handler for creating a new category.

    Expected request body:
    {
        "name": "Technology",
        "description": "Tech news and updates"
    }

    Returns:
        201: Category created successfully with category ID
        400: Validation error
        500: Internal server error
    """
    logger.info("Received event", extra={"event": event})

    try:
        # Parse body
        body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            body = base64.b64decode(body).decode("utf-8")
            logger.debug("Decoded base64 body", extra={"body": body})

        payload = json.loads(body)
        logger.debug("Parsed JSON payload", extra={"payload": payload})

        # Validate payload
        data = CreateCategorySchema(**payload)

        # Generate unique ID
        category_id = str(uuid.uuid4())
        logger.info("Generated category ID", extra={"category_id": category_id})

        # Check if category with same name already exists
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

        # Build DynamoDB item
        category = CategoryModel(
            id=category_id,
            name=data.name,
            description=data.description or "",
        )

        # Save to DynamoDB
        category.save()
        logger.info("Category saved successfully", extra={"category": category.attribute_values})

        return {
            "statusCode": 201,
            "body": json.dumps({
                "message": "Category created successfully",
                "category": {
                    "id": category_id,
                    "name": data.name,
                    "description": data.description
                }
            })
        }

    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
