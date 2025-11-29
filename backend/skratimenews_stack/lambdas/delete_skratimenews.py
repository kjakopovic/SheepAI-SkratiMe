import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from aws_lambda_powertools import Logger


TABLE_NAME = os.environ["TABLE_NAME"]
AWS_REGION = "eu-central-1"



class SkratimenewsModel(Model):
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    
    



logger = Logger(service="SkratimenewsDeleteLambda")

def handler(event, context):
    logger.info("Received event", extra={"event": event})

    try:
        path_params = event.get("pathParameters") or {}
        partition_key_value = path_params.get("id")

        

        
        logger.debug("Constructed key for lookup", extra={"key": partition_key_value})

        item = SkratimenewsModel.get(partition_key_value)
        logger.info("Fetched item from database", extra={"item": item.attribute_values})

        

        item.delete()
        logger.info("Deleted item from database", extra={"key": partition_key_value})

        response = {"statusCode": 200, "body": json.dumps({"message": "Item deleted"})}
        logger.info("Returning response", extra={"response": response})
        return response

    except SkratimenewsModel.DoesNotExist:
        logger.warning("Item not found", extra={"key": partition_key_value})
        return {"statusCode": 404, "body": json.dumps({"error": "Item not found"})}

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}