import json
import os
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from aws_lambda_powertools import Logger
import base64

# Configure logging
logger = Logger()

# Initialize Cognito client
cognito_client = boto3.client("cognito-idp")

# Environment variables
USER_POOL_ID = os.environ["USER_POOL_ID"]
USER_POOL_CLIENT_ID = os.environ["USER_POOL_CLIENT_ID"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

# Set default headers for CORS
HEADERS = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
}


@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    request_id = context.aws_request_id
    logger.append_keys(request_id=request_id)

    # Handle preflight OPTIONS requests for CORS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Allow-Credentials": "true",
            },
            "body": "",
        }

    event_body = json.loads(event.get("body")) if "body" in event else event
    email = event_body.get("email")
    password = event_body.get("password")

    # Validate input
    if not email or not password:
        logger.warning(
            "Login validation failed",
            extra={
                "reason": "missing_credentials",
                "has_email": bool(email),
                "has_password": bool(event_body.get("password")),
            },
        )
        return {
            "statusCode": 400,
            "headers": HEADERS,
            "body": json.dumps({"message": "Email and password are required"}),
        }

    return log_in_user(email, password)


def log_in_user(email, password):
    try:
        # Authenticate user using Cognito
        response = cognito_client.initiate_auth(
            ClientId=USER_POOL_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
        )

        # Extract tokens from the response
        id_token = response["AuthenticationResult"]["IdToken"]
        access_token = response["AuthenticationResult"]["AccessToken"]
        refresh_token = response["AuthenticationResult"]["RefreshToken"]
        expires_in = response["AuthenticationResult"]["ExpiresIn"]

        # Decode ID token to get user information
        user_info = decode_id_token(id_token)
        user_email = user_info.get("email", email)
        user_full_name = user_info.get("name", "")

        user_profile = fetch_user_profile(access_token)

        # IMPORTANT: API Gateway requires multiple Set-Cookie headers
        # Each cookie must be set with its own header

        # For local development, remove Secure attribute if using http://localhost
        if not ALLOWED_ORIGIN.startswith("https://"):
            cookie_settings = "HttpOnly; Path=/; SameSite=Lax"
        else:
            cookie_settings = "HttpOnly; Secure; Path=/; SameSite=None"

        logger.info(
            "Authentication successful",
            extra={
                "email": user_email,
                "full_name": user_full_name,
                "token_expires_in": expires_in,
            },
        )
        # Return the minimal necessary info in the response body plus cookies
        return {
            "statusCode": 200,
            "multiValueHeaders": {
                "Set-Cookie": [
                    f"accessToken={access_token}; {cookie_settings}; Max-Age={expires_in}",
                    f"idToken={id_token}; {cookie_settings}; Max-Age={expires_in}",
                    f"refreshToken={refresh_token}; {cookie_settings}; Max-Age=2592000",
                ],
                "Access-Control-Allow-Origin": [ALLOWED_ORIGIN],
                "Access-Control-Allow-Credentials": ["true"],
                "Content-Type": ["application/json"],
            },
            "body": json.dumps(
                {
                    "message": "User registered successfully",
                    "isAuthenticated": True,
                    "accessToken": access_token,
                    "idToken": id_token,
                    "user": {
                        "email": user_email,
                        "fullName": user_full_name,
                        **user_profile,
                    },
                }
            ),
        }

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "UnknownError")
        error_message = e.response.get("Error", {}).get("Message", str(e))

        logger.error(
            "Cognito authentication error",
            extra={"error_code": error_code, "error_message": error_message},
        )

        headers = {
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Credentials": "true",
            "Content-Type": "application/json",
        }

        if error_code == "NotAuthorizedException":
            return {
                "statusCode": 401,
                "headers": headers,
                "body": json.dumps({"message": "Incorrect username or password"}),
            }
        elif error_code == "UserNotFoundException":
            return {
                "statusCode": 404,
                "headers": headers,
                "body": json.dumps({"message": "User does not exist"}),
            }

        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"message": f"Login error: {error_message}"}),
        }

    except Exception as e:
        logger.exception("Unexpected error during login", extra={"error": str(e)})

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Credentials": "true",
                "Content-Type": "application/json",
            },
            "body": json.dumps({"message": "An unexpected error occurred"}),
        }


def fetch_user_profile(access_token):
    try:
        user_response = cognito_client.get_user(AccessToken=access_token)
        attributes = {
            attr["Name"]: attr["Value"]
            for attr in user_response.get("UserAttributes", [])
        }
        personal_categories = attributes.get("custom:personal_categories")
        user_interests = attributes.get("custom:user_interests")
        return {
            "personal_categories": (
                json.loads(personal_categories) if personal_categories else []
            ),
            "notion_link": attributes.get("custom:notion_link", ""),
            "user_interests": json.loads(user_interests) if user_interests else [],
        }
    except Exception as exc:
        logger.warning("Failed to fetch user profile", extra={"error": str(exc)})
        return {
            "personalCategories": [],
            "notionLink": "",
            "userInterests": [],
        }


def decode_id_token(id_token):
    """
    Decode the ID token to extract user information.
    Note: This is a basic decode without signature verification for simplicity.
    In production, you should verify the signature.
    """
    try:
        # Split the token into header, payload, and signature
        parts = id_token.split(".")
        if len(parts) != 3:
            return {}

        # Decode the payload (second part)
        payload = parts[1]
        # Add padding if needed
        payload += "=" * (4 - len(payload) % 4)

        # Decode base64
        decoded_bytes = base64.urlsafe_b64decode(payload)
        decoded_str = decoded_bytes.decode("utf-8")

        # Parse JSON
        claims = json.loads(decoded_str)

        return claims

    except Exception as e:
        logger.warning("Failed to decode ID token", extra={"error": str(e)})
        return {}
