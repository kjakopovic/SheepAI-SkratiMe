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


class SkratimecategoriesStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # === DynamoDB Table for Categories ===
        categories_table = dynamodb.Table(
            self,
            "SkratimecategoriesTable",
            partition_key={"name": "id", "type": dynamodb.AttributeType.STRING},
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        # === GSI: category-name-index for querying by name ===
        categories_table.add_global_secondary_index(
            index_name="category-name-index",
            partition_key=dynamodb.Attribute(
                name="name",
                type=dynamodb.AttributeType.STRING,
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # === Import existing Cognito User Pool ===
        user_pool = cognito.UserPool.from_user_pool_id(
            self, "UserPool", user_pool_id="eu-central-1_Ih32d60MT"
        )

        # === Import existing News DynamoDB Table ===
        # We need the news table ARN to grant read permissions for news-by-categories endpoint
        news_table_name = "SkratimenewsStack-SkratimenewsTable3F8F91C3-1E6NFMVY4B73W"  # You may need to adjust this

        # Create Cognito authorizer
        auth = apigateway.CognitoUserPoolsAuthorizer(
            self, "SkratimecategoriesAuthorizer", cognito_user_pools=[user_pool]
        )

        # === Create API Gateway ===
        api = apigateway.RestApi(
            self,
            "SkratimecategoriesApi",
            rest_api_name="Skratimecategories API",
            description="API for Categories with Cognito authorization",
        )

        # === Create API Resources ===
        categories_resource = api.root.add_resource("categories")
        category_resource = categories_resource.add_resource("{id}")
        news_by_categories_resource = api.root.add_resource("news-by-categories")

        # === Lambda Functions for Categories CRUD ===
        lambda_functions = {}

        # Standard CRUD operations
        for op in ["create", "get", "update", "delete"]:
            env_vars = {
                "TABLE_NAME": categories_table.table_name,
            }

            fn = _lambda.Function(
                self,
                f"{op.capitalize()}CategoryLambda",
                runtime=_lambda.Runtime.PYTHON_3_12,
                handler=f"{op}_category.handler",
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

            categories_table.grant_read_write_data(fn)
            lambda_functions[op] = fn

        # === Lambda Function for Get News by Categories ===
        get_news_by_categories_fn = _lambda.Function(
            self,
            "GetNewsByCategoriesLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="get_news_by_categories.handler",
            code=_lambda.Code.from_asset(
                os.path.join("lambdas"),
                bundling={
                    "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                    "command": [
                        "bash",
                        "-c",
                        "pip install pynamodb pydantic aws-lambda-powertools boto3 -t /asset-output && cp -r . /asset-output",
                    ],
                },
            ),
            environment={
                "CATEGORIES_TABLE_NAME": categories_table.table_name,
                "NEWS_TABLE_NAME": news_table_name,
            },
        )

        # Grant read permissions to both tables
        categories_table.grant_read_data(get_news_by_categories_fn)
        # Grant read permission to news table using table name
        get_news_by_categories_fn.add_to_role_policy(
            statement=apigateway.iam.PolicyStatement(
                actions=["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem"],
                resources=[
                    f"arn:aws:dynamodb:{self.region}:{self.account}:table/{news_table_name}",
                    f"arn:aws:dynamodb:{self.region}:{self.account}:table/{news_table_name}/index/*",
                ],
            )
        )

        # === Add Methods to API Gateway ===

        # POST /categories - Create category
        categories_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(lambda_functions["create"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        # GET /categories - Get categories (with filtering)
        categories_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(lambda_functions["get"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        # PUT /categories/{id} - Update category
        category_resource.add_method(
            "PUT",
            apigateway.LambdaIntegration(lambda_functions["update"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        # DELETE /categories/{id} - Delete category
        category_resource.add_method(
            "DELETE",
            apigateway.LambdaIntegration(lambda_functions["delete"]),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        # GET /news-by-categories - Get news by categories
        news_by_categories_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(get_news_by_categories_fn),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        # === Outputs ===
        CfnOutput(
            self,
            "CategoriesApiEndpoint",
            description="Categories API Gateway URL",
            value=api.url,
        )

        CfnOutput(
            self,
            "CategoriesTableName",
            description="Categories DynamoDB Table Name",
            value=categories_table.table_name,
        )


app = App()
SkratimecategoriesStack(app, "SkratimecategoriesStack")
app.synth()
