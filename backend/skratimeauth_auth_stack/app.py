from aws_cdk import (
    App, Stack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_cognito as cognito,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_iam as iam,
)
from constructs import Construct

class SkratimeauthAuthStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Cognito User Pool
        user_pool = cognito.UserPool(
            self,
            "SkratimeauthUserPool",
            user_pool_name="SkratimeauthUserPool",
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            sign_in_aliases=cognito.SignInAliases(email=True),
            self_sign_up_enabled=True,
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False,
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # User Pool Client
        user_pool_client = cognito.UserPoolClient(
            self,
            "SkratimeauthUserPoolClient",
            user_pool=user_pool,
            user_pool_client_name="SkratimeauthWebApp",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                user_srp=True,
                user_password=True,
                custom=False,
                admin_user_password=False,
            ),
            prevent_user_existence_errors=True,
        )

        # IAM Policy for Lambda functions to access Cognito
        cognito_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "cognito-idp:SignUp",
                "cognito-idp:AdminConfirmSignUp",
                "cognito-idp:InitiateAuth",
            ],
            resources=[user_pool.user_pool_arn],
        )

        # Register User Lambda Function
        register_lambda = _lambda.Function(
            self,
            "RegisterUserLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_handler.lambda_handler",
            code=_lambda.Code.from_asset(
                "./Register",
                bundling={
                    "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                    "command": ["bash", "-c", "pip install aws-lambda-powertools -t /asset-output && cp -r . /asset-output"],
                },
            ),
            environment={
                "POWERTOOLS_SERVICE_NAME": "authentication",
                "USER_POOL_ID": user_pool.user_pool_id,
                "USER_POOL_CLIENT_ID": user_pool_client.user_pool_client_id,
            },
            timeout=Duration.seconds(30),
        )
        register_lambda.add_to_role_policy(cognito_policy)

        # Login User Lambda Function
        login_lambda = _lambda.Function(
            self,
            "LoginUserLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_handler.lambda_handler",
            code=_lambda.Code.from_asset(
                "./Login",
                bundling={
                    "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                    "command": ["bash", "-c", "pip install aws-lambda-powertools -t /asset-output && cp -r . /asset-output"],
                },
            ),
            environment={
                "POWERTOOLS_SERVICE_NAME": "authentication",
                "USER_POOL_ID": user_pool.user_pool_id,
                "USER_POOL_CLIENT_ID": user_pool_client.user_pool_client_id,
            },
            timeout=Duration.seconds(30),
        )
        login_lambda.add_to_role_policy(cognito_policy)

        # API Gateway
        api = apigw.RestApi(
            self,
            "SkratimeauthAuthApi",
            rest_api_name="Skratimeauth Auth API",
            description="Skratimeauth Authentication Services API",
            deploy=True,
            deploy_options=apigw.StageOptions(
                stage_name="auth"
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=apigw.Cors.DEFAULT_HEADERS,
            ),
        )

        # API Gateway Integrations
        register_integration = apigw.LambdaIntegration(register_lambda)
        login_integration = apigw.LambdaIntegration(login_lambda)

        # API Gateway Resources and Methods
        api.root.add_resource("register").add_method("POST", register_integration)
        api.root.add_resource("login").add_method("POST", login_integration)

        # Outputs
        CfnOutput(
            self,
            "AuthApiEndpoint",
            description="Auth API Gateway URL",
            value=f"https://{api.rest_api_id}.execute-api.{self.region}.amazonaws.com/auth",
        )

        CfnOutput(
            self,
            "UserPoolId",
            description="User Pool ID for Skratimeauth",
            value=user_pool.user_pool_id,
            export_name="SkratimeauthUserPoolId"
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            description="User Pool Client ID for Skratimeauth",
            value=user_pool_client.user_pool_client_id,
        )

        CfnOutput(
            self,
            "UserPoolArn",
            description="User Pool ARN for Skratimeauth",
            value=user_pool.user_pool_arn,
        )


app = App()
SkratimeauthAuthStack(app, "SkratimeauthAuthStack")
app.synth()