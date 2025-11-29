from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_cognito as cognito,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_iam as iam,
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

        # === Text-to-Speech Lambda Function ===
        # Create audio generation endpoint: POST /news/audio
        audio_resource = items_resource.add_resource("audio")

        # Lambda function for generating audio from news posts
        generate_audio_lambda = _lambda.Function(
            self,
            "GenerateAudioSkratimenewsLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="generate_audio_skratimenews.handler",
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
                "TABLE_NAME": table.table_name,
                "AUDIO_BUCKET_NAME": audio_bucket.bucket_name,
                "POLLY_VOICE_ID": "Joanna",  # Can be changed to other voices
            },
            timeout=Duration.seconds(120),  # Increased timeout for Polly processing
            memory_size=512,  # Increased memory for audio processing
        )

        # Grant permissions to Lambda
        table.grant_read_data(generate_audio_lambda)  # Read news items
        audio_bucket.grant_put(generate_audio_lambda)  # Upload audio files
        audio_bucket.grant_read(generate_audio_lambda)  # Generate presigned URLs

        # Grant Polly permissions
        generate_audio_lambda.add_to_role_policy(
            iam.PolicyStatement(
                actions=["polly:SynthesizeSpeech"],
                resources=["*"],  # Polly doesn't support resource-level permissions
            )
        )

        # Add API Gateway method for audio generation
        audio_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(generate_audio_lambda),
            authorizer=auth,
            authorization_type=apigateway.AuthorizationType.COGNITO,
        )

        # === CDK Outputs ===
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self,
            "AudioBucketName",
            value=audio_bucket.bucket_name,
            description="S3 bucket for audio files",
        )


app = App()
SkratimenewsStack(app, "SkratimenewsStack")
app.synth()
