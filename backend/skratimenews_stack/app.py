from aws_cdk import (
    App,
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_cognito as cognito,
    aws_apigateway as apigateway,
)
from constructs import Construct
from aws_cdk import CfnOutput
import os


class SkratimenewsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # === DynamoDB Table ===
        table = dynamodb.Table(
            self,
            "SkratimenewsTable",
            partition_key={"name": "id", "type": dynamodb.AttributeType.STRING},
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        # === Lambda Functions ===

        # Import existing Cognito User Pool
        user_pool = cognito.UserPool.from_user_pool_id(
            self, "UserPool", user_pool_id="eu-central-1_Ih32d60MT"
        )

        # Create Cognito authorizer
        auth = apigateway.CognitoUserPoolsAuthorizer(
            self, "SkratimenewsAuthorizer", cognito_user_pools=[user_pool]
        )

        # Create API Gateway
        api = apigateway.RestApi(
            self,
            "SkratimenewsApi",
            rest_api_name="Skratimenews API",
            description="API for Skratimenews with Cognito authorization",
        )

        # Create API resources
        items_resource = api.root.add_resource("news")
        item_resource = items_resource.add_resource("{id}")

        # Create Lambda functions and integrate with API Gateway
        lambda_functions = {}
        for op in ["create", "get", "update", "delete"]:
            env_vars = {"TABLE_NAME": table.table_name}

            fn = _lambda.Function(
                self,
                f"{op.capitalize()}SkratimenewsLambda",
                runtime=_lambda.Runtime.PYTHON_3_12,
                handler=f"{op}_skratimenews.handler",
                code=_lambda.Code.from_asset(
                    os.path.join("lambdas"),
                    bundling={
                        "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                        "command": [
                            "bash",
                            "-c",
                            "pip install pynamodb pydantic aws-lambda-powertools -t /asset-output && cp -r . /asset-output",
                        ],
                    },
                ),
                environment=env_vars,
            )

            table.grant_read_write_data(fn)

            lambda_functions[op] = fn

        # Add methods to API Gateway with Cognito authorizer
        items_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(lambda_functions["create"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        items_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(lambda_functions["get"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        item_resource.add_method(
            "PUT",
            apigateway.LambdaIntegration(lambda_functions["update"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        item_resource.add_method(
            "DELETE",
            apigateway.LambdaIntegration(lambda_functions["delete"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )


app = App()
SkratimenewsStack(app, "SkratimenewsStack")
app.synth()
