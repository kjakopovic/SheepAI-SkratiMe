from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_cognito as cognito,
    aws_apigateway as apigateway,
    aws_events as events,
    aws_sqs as sqs,
    aws_events_targets as targets,
    Duration,
    aws_iam as iam,
)
from constructs import Construct
from aws_cdk import CfnOutput
import os

BEDROCK_MODEL_ID = "amazon.titan-text-lite-v1"


class SkratimenewsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # === DynamoDB Table for News ===
        table = dynamodb.Table(
            self,
            "SkratimenewsTable",
            partition_key={"name": "id", "type": dynamodb.AttributeType.STRING},
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        # === DynamoDB Table for User Bookmarks ===
        bookmarks_table = dynamodb.Table(
            self,
            "UserBookmarksTable",
            partition_key={"name": "user_id", "type": dynamodb.AttributeType.STRING},
            sort_key={"name": "news_id", "type": dynamodb.AttributeType.STRING},
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # === S3 Bucket for Audio Files ===
        audio_bucket = s3.Bucket(
            self,
            "SkratimenewsAudioBucket",
            # Bucket name will be auto-generated with account ID
            bucket_name=None,
            # Enable versioning for data protection
            versioned=False,
            # Encryption at rest
            encryption=s3.BucketEncryption.S3_MANAGED,
            # Block all public access - use presigned URLs instead
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Lifecycle rule: delete audio files after 7 days to save costs
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldAudioFiles",
                    enabled=True,
                    expiration=Duration.days(7),
                    # Also clean up incomplete multipart uploads
                    abort_incomplete_multipart_upload_after=Duration.days(1),
                )
            ],
            # CORS configuration for frontend access
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowed_origins=["*"],  # Adjust for production
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
            # Removal policy for development
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # === GSI: news-category-index ===
        table.add_global_secondary_index(
            index_name="news-category-index",
            partition_key=dynamodb.Attribute(
                name="category_id",
                type=dynamodb.AttributeType.STRING,
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        fetch_table = dynamodb.Table(
            self,
            "ScrapeTracking",
            partition_key={
                "name": "last_scrape",
                "type": dynamodb.AttributeType.STRING,
            },
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        categories_table = dynamodb.Table(
            self,
            "CategoriesTable",
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
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                ],
                allow_credentials=True,
            ),
        )

        # Create API resources
        items_resource = api.root.add_resource("news")
        item_resource = items_resource.add_resource("{id}")

        categories_resource = api.root.add_resource("categories")

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

        get_category_lambda = _lambda.Function(
            self,
            "GetCategoryLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="get_category.handler",
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
            environment={
                "CATEGORIES_TABLE_NAME": categories_table.table_name,
            },
        )

        create_category_lambda = _lambda.Function(
            self,
            "CreateCategoryLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="create_category.handler",
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
            environment={
                "CATEGORIES_TABLE_NAME": categories_table.table_name,
            },
        )

        categories_table.grant_read_write_data(create_category_lambda)
        categories_table.grant_read_data(get_category_lambda)

        # Add methods to API Gateway with Cognito authorizer
        categories_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(create_category_lambda),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        categories_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(get_category_lambda),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

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

        # === SQS Queue ===
        rss_queue = sqs.Queue(
            self,
            "RssNewsQueue",
            visibility_timeout=Duration.seconds(120),
        )

        categorizer_lambda = _lambda.Function(
            self,
            "CategorizerLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="categorizer.lambda_handler",
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
            environment={
                "NEWS_TABLE_NAME": table.table_name,
                "CATEGORIES_TABLE_NAME": categories_table.table_name,
            },
        )

        categorizer_lambda.add_event_source_mapping(
            "CategorizerQueueMapping",
            event_source_arn=rss_queue.queue_arn,
            batch_size=10,
            enabled=True,
        )

        categorizer_lambda.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel"],
                resources=[
                    f"arn:aws:bedrock:{self.region}::foundation-model/{BEDROCK_MODEL_ID}"
                ],
            )
        )

        rss_queue.grant_consume_messages(categorizer_lambda)
        categories_table.grant_read_write_data(categorizer_lambda)
        table.grant_read_write_data(categorizer_lambda)

        # === RSS Lambda ===
        rss_lambda = _lambda.Function(
            self,
            "RssFetcherLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="scrape_web.lambda_handler",
            code=_lambda.Code.from_asset(
                os.path.join("lambdas"),
                bundling={
                    "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                    "command": [
                        "bash",
                        "-c",
                        "pip install pynamodb pydantic aws-lambda-powertools feedparser beautifulsoup4 requests -t /asset-output && cp -r . /asset-output",
                    ],
                },
            ),
            environment={
                "RSS_URL": "https://feeds.feedburner.com/TheHackersNews",
                "TABLE_NAME": fetch_table.table_name,
                "RSS_QUEUE_URL": rss_queue.queue_url,
            },
        )

        # Grant permissions
        fetch_table.grant_read_write_data(rss_lambda)
        rss_queue.grant_send_messages(rss_lambda)

        # === EventBridge Rule ===
        rule = events.Rule(
            self,
            "RssScheduleRule",
            schedule=events.Schedule.rate(duration=Duration.minutes(2)),
        )

        rule.add_target(targets.LambdaFunction(rss_lambda))


app = App()
SkratimenewsStack(app, "SkratimenewsStack")
app.synth()
