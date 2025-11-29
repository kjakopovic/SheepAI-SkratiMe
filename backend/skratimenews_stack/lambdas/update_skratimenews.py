import os
import base64
import json
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
    




class UpdateSkratimenewsSchema(BaseModel):
    
    
    
    title: str | None = None
    
    summary: str | None = None
    
    category_id: str | None = None
    
    picture_url: str | None = None
    

logger = Logger(service="SkratimenewsUpdateLambda")

def handler(event, context):
    logger.info("Received event", extra={"event": event})

    try:
        path_params = event.get("pathParameters") or {}
        partition_key_value = path_params.get("id")

        

        # Parse body
        body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            body = base64.b64decode(body).decode("utf-8")
            logger.debug("Decoded base64 body", extra={"body": body})

        payload = json.loads(body)
        logger.debug("Parsed JSON payload", extra={"payload": payload})

        data = UpdateSkratimenewsSchema(**payload)
        logger.info("Payload validated against schema")

        key = partition_key_value
        
        item = SkratimenewsModel.get(key)
        logger.info("Fetched existing item", extra={"key": key})

        
        if data.title is not None:
            item.title = data.title
            logger.debug("Updated field")
        
        if data.summary is not None:
            item.summary = data.summary
            logger.debug("Updated field")
        
        if data.category_id is not None:
            item.category_id = data.category_id
            logger.debug("Updated field")
        
        if data.picture_url is not None:
            item.picture_url = data.picture_url
            logger.debug("Updated field")
        
        item.save()
        logger.info("Item saved successfully")

        
        response = {
            "statusCode": 200,
            "body": json.dumps({"message": "Item updated"})
        }
        

        logger.info("Returning response", extra={"response": response})
        return response

    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

    except SkratimenewsModel.DoesNotExist:
        logger.warning("Item not found", extra={"key": key})
        return {"statusCode": 404, "body": json.dumps({"error": "Item not found"})}

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}