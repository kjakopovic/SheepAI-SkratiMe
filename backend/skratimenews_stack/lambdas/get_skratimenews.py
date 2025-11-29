import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from aws_lambda_powertools import Logger

ITEMS_PER_PAGE = 10
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
    

logger = Logger(service="SkratimenewsGetLambda")

def handler(event, context):
    logger.info("Received event", extra={"event": event})

    try:
        query_params = event.get("queryStringParameters") or {}
        item_id = query_params.get("id")
        last_evaluated_key = query_params.get("last_evaluated_key")

        if item_id:
            # Fetch single item by id
            logger.debug("Fetching single item", extra={"id": item_id})
            item = SkratimenewsModel.get(item_id)
            response_body = item.attribute_values.copy()

            

            return {"statusCode": 200, "body": json.dumps(response_body)}

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
                "last_evaluated_key": json.dumps(last_key) if last_key else None
            }

            return {"statusCode": 200, "body": json.dumps(response_body)}

    except SkratimenewsModel.DoesNotExist:
        logger.warning("Item not found", extra={"id": item_id})
        return {"statusCode": 404, "body": json.dumps({"error": "Item not found"})}

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)})
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}