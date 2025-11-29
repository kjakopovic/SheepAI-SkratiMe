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


class SkratimenewsModel(Model):
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)

    title = UnicodeAttribute(null=True)

    summary = UnicodeAttribute(null=True)

    category_id = UnicodeAttribute(null=True)

    picture_url = UnicodeAttribute(null=True)


class CreateSkratimenewsSchema(BaseModel):

    title: str

    summary: str

    category_id: str

    picture_url: str


logger = Logger(service="SkratimenewsCreateLambda")


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

        data = CreateSkratimenewsSchema(**payload)

        # Generate unique ID and s3_key
        item_id = str(uuid.uuid4())

        logger.info(
            "Generated IDs",
            extra={
                "item_id": item_id,
            },
        )

        # Build DynamoDB item
        item = SkratimenewsModel(
            id=item_id,
            title=data.title,
            summary=data.summary,
            category_id=data.category_id,
            picture_url=data.picture_url,
        )

        # Save to DynamoDB
        item.save()
        logger.info("Item saved successfully", extra={"item": item.attribute_values})

        return {"statusCode": 201, "body": json.dumps({"message": "Item created"})}

    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
