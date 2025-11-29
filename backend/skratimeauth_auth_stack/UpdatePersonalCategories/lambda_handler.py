import json
import os
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()

# Initialize Cognito client
cognito_client = boto3.client("cognito-idp")

# Environment variables
USER_POOL_ID = os.environ["USER_POOL_ID"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

# Set default headers for CORS
HEADERS = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
}


def extract_user_from_token(event):
    """
    Extract user information from Cognito JWT token in the Authorization header.

    When using Cognito authorizer, the user information is available in:
    - event['requestContext']['authorizer']['claims']

    Returns:
        str: Username (sub claim from JWT)
    """
    try:
        # When using Cognito User Pool authorizer, claims are in requestContext
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})

        # The 'sub' claim is the unique user identifier in Cognito
        username = claims.get("cognito:username") or claims.get("sub")

        if not username:
            logger.error("No username found in JWT claims", extra={"claims": claims})
            raise ValueError("Unable to extract user from token")

        logger.info("Extracted user from token", extra={"username": username})
        return username

    except Exception as e:
        logger.error("Error extracting user from token", extra={"error": str(e)})
        raise


@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    """
    Lambda handler for updating user personal categories.

    This endpoint allows authenticated users to update their personal category preferences.
    The personal_categories field stores a JSON array of category IDs that the user is interested in.

    Expected request body:
    {
        "personal_categories": ["category-id-1", "category-id-2", "category-id-3"]
    }

    Or to clear personal categories:
    {
        "personal_categories": []
    }

    Returns:
        200: Personal categories updated successfully
        400: Invalid request body or validation error
        401: Unauthorized (no valid token)
        500: Internal server error
    """
    # Handle preflight OPTIONS requests for CORS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,PATCH,PUT",
                "Access-Control-Allow-Credentials": "true",
            },
            "body": "",
        }

    # Extract request information for logging
    request_id = context.aws_request_id
    logger.append_keys(request_id=request_id)

    try:
        # Extract username from JWT token
        username = extract_user_from_token(event)

        # Parse request body
        event_body = json.loads(event.get("body", "{}"))
        personal_categories = event_body.get("personal_categories")

        # Validate input
        if personal_categories is None:
            logger.warning("Missing personal_categories in request body")
            return {
                "statusCode": 400,
                "headers": HEADERS,
                "body": json.dumps({
                    "error": "personal_categories field is required"
                }),
            }

        # Validate that personal_categories is a list
        if not isinstance(personal_categories, list):
            logger.warning("Invalid personal_categories format", extra={
                "type": type(personal_categories).__name__
            })
            return {
                "statusCode": 400,
                "headers": HEADERS,
                "body": json.dumps({
                    "error": "personal_categories must be an array of category IDs"
                }),
            }

        # Validate that all items are strings
        if not all(isinstance(cat_id, str) for cat_id in personal_categories):
            logger.warning("Invalid category ID format in personal_categories")
            return {
                "statusCode": 400,
                "headers": HEADERS,
                "body": json.dumps({
                    "error": "All category IDs must be strings"
                }),
            }

        # Update user attributes in Cognito
        # Store as JSON string in Cognito custom attribute
        personal_categories_value = json.dumps(personal_categories)

        logger.info("Updating personal categories", extra={
            "username": username,
            "categories_count": len(personal_categories)
        })

        cognito_client.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=username,
            UserAttributes=[
                {
                    "Name": "custom:personal_categories",
                    "Value": personal_categories_value
                }
            ]
        )

        logger.info("Personal categories updated successfully", extra={
            "username": username,
            "categories": personal_categories
        })

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "message": "Personal categories updated successfully",
                "personal_categories": personal_categories
            }),
        }

    except ValueError as e:
        # Token extraction failed
        logger.warning("Authentication error", extra={"error": str(e)})
        return {
            "statusCode": 401,
            "headers": HEADERS,
            "body": json.dumps({
                "error": "Unauthorized - invalid or missing token"
            }),
        }

    except json.JSONDecodeError as e:
        logger.warning("Invalid JSON in request body", extra={"error": str(e)})
        return {
            "statusCode": 400,
            "headers": HEADERS,
            "body": json.dumps({
                "error": "Invalid JSON in request body"
            }),
        }

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]

        logger.error("Cognito client error", extra={
            "error_code": error_code,
            "error_message": error_message,
            "operation": "admin_update_user_attributes"
        })

        if error_code == "UserNotFoundException":
            return {
                "statusCode": 404,
                "headers": HEADERS,
                "body": json.dumps({
                    "error": "User not found"
                }),
            }
        elif error_code == "InvalidParameterException":
            return {
                "statusCode": 400,
                "headers": HEADERS,
                "body": json.dumps({
                    "error": "Invalid personal categories format"
                }),
            }

        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({
                "error": f"Error updating personal categories: {error_message}"
            }),
        }

    except Exception as e:
        logger.exception("Unexpected error", extra={"error": str(e)})
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({
                "error": "An unexpected error occurred"
            }),
        }
