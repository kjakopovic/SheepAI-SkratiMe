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


def parse_user_attributes(attributes):
    """
    Parse Cognito user attributes into a structured dictionary.

    Args:
        attributes: List of user attributes from Cognito

    Returns:
        dict: Parsed user profile data
    """
    profile = {
        "email": None,
        "name": None,
        "email_verified": False,
        "notion_link": None,
        "user_interests": [],
        "personal_categories": [],
    }

    for attr in attributes:
        attr_name = attr["Name"]
        attr_value = attr.get("Value", "")

        if attr_name == "email":
            profile["email"] = attr_value
        elif attr_name == "name":
            profile["name"] = attr_value
        elif attr_name == "email_verified":
            profile["email_verified"] = attr_value.lower() == "true"
        elif attr_name == "custom:notion_link":
            profile["notion_link"] = attr_value
        elif attr_name == "custom:user_interests":
            try:
                profile["user_interests"] = json.loads(attr_value) if attr_value else []
            except json.JSONDecodeError:
                logger.warning("Failed to parse user_interests", extra={"value": attr_value})
                profile["user_interests"] = []
        elif attr_name == "custom:personal_categories":
            try:
                profile["personal_categories"] = json.loads(attr_value) if attr_value else []
            except json.JSONDecodeError:
                logger.warning("Failed to parse personal_categories", extra={"value": attr_value})
                profile["personal_categories"] = []

    return profile


@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    """
    Lambda handler for retrieving user profile information.

    This endpoint allows authenticated users to retrieve their profile data,
    including email, name, notion_link, user_interests, and personal_categories.

    Returns:
        200: User profile retrieved successfully
        401: Unauthorized (no valid token)
        404: User not found
        500: Internal server error

    Response format:
    {
        "email": "user@example.com",
        "name": "John Doe",
        "email_verified": true,
        "notion_link": "https://notion.so/...",
        "user_interests": ["AI", "Technology"],
        "personal_categories": ["category-id-1", "category-id-2"]
    }
    """
    # Handle preflight OPTIONS requests for CORS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,GET",
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

        logger.info("Fetching user profile", extra={"username": username})

        # Get user attributes from Cognito
        response = cognito_client.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=username
        )

        # Parse user attributes
        profile = parse_user_attributes(response.get("UserAttributes", []))

        # Add additional metadata
        profile["username"] = response.get("Username")
        profile["user_status"] = response.get("UserStatus")
        profile["enabled"] = response.get("Enabled", True)

        logger.info("User profile retrieved successfully", extra={
            "username": username,
            "has_personal_categories": len(profile["personal_categories"]) > 0
        })

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps(profile),
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

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]

        logger.error("Cognito client error", extra={
            "error_code": error_code,
            "error_message": error_message,
            "operation": "admin_get_user"
        })

        if error_code == "UserNotFoundException":
            return {
                "statusCode": 404,
                "headers": HEADERS,
                "body": json.dumps({
                    "error": "User not found"
                }),
            }

        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({
                "error": f"Error retrieving user profile: {error_message}"
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
