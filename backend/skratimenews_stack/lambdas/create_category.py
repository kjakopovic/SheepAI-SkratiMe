import os
import base64
import json
import uuid
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from pydantic import BaseModel, ValidationError
from aws_lambda_powertools import Logger


CATEGORIES_TABLE_NAME = os.environ["CATEGORIES_TABLE_NAME"]
AWS_REGION = "eu-central-1"


class CategoriesModel(Model):
    class Meta:
        table_name = CATEGORIES_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)

    name = UnicodeAttribute(null=True)


class CreateCategorySchema(BaseModel):
    """Validation schema for creating a category."""

    name: str


logger = Logger(service="CategoryCreateLambda")


def handler(event, context):
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

        # Build DynamoDB item
        category = CategoriesModel(
            id=category_id,
            name=data.name,
        )

        # Save to DynamoDB
        category.save()
        logger.info(
            "Category saved successfully", extra={"category": category.attribute_values}
        )

        return {
            "statusCode": 201,
            "body": json.dumps(
                {
                    "message": "Category created successfully",
                    "category": {
                        "id": category_id,
                        "name": data.name,
                    },
                }
            ),
        }

    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
