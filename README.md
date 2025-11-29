# SheepAI-SkratiMe

## Overview

SheepAI-SkratiMe is a modern, serverless news platform that allows users to consume news content in both text and audio formats. Built for a hackathon, this full-stack application leverages AWS services to provide a scalable, cloud-native solution for personalized news delivery.

## Key Features

- **User Authentication**: Secure user registration and login powered by AWS Cognito
- **News Management**: Full CRUD operations for news articles with category-based organization
- **Text-to-Speech**: Convert news articles to audio using AWS Polly, allowing users to listen to their news on the go
- **Personalized Categories**: Users can customize their news feed by selecting personal categories
- **Modern Web Interface**: Responsive React-based frontend with Tailwind CSS and shadcn/ui components
- **Serverless Architecture**: Fully serverless backend using AWS Lambda, DynamoDB, API Gateway, and S3

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** (React Query) for server state management
- **React Router v7** for navigation
- **Tailwind CSS v4** with shadcn/ui components
- **i18next** for internationalization
- **Framer Motion** for animations
- **React Hook Form** with Yup/Zod validation

### Backend
- **AWS CDK** (Python) for infrastructure as code
- **AWS Cognito** for authentication and user management
- **AWS Lambda** (Python 3.12) for serverless compute
- **AWS API Gateway** for REST API endpoints
- **AWS DynamoDB** for NoSQL database
- **AWS Polly** for text-to-speech conversion
- **AWS S3** for audio file storage
- **PynamoDB** for DynamoDB ORM
- **Pydantic** for data validation
- **AWS Lambda Powertools** for observability

## Architecture

The application consists of two main CDK stacks:

1. **Authentication Stack** (`skratimeauth_auth_stack`)
   - Cognito User Pool for user management
   - Lambda functions for registration and login
   - API Gateway endpoints for authentication

2. **News Stack** (`skratimenews_stack`)
   - DynamoDB table for storing news articles
   - Lambda functions for CRUD operations
   - Category management and filtering
   - Text-to-speech conversion using AWS Polly
   - S3 bucket for hosting generated audio files
   - Cognito-protected API endpoints

## Use Cases

1. **Busy Professionals**: Listen to news during commute or workouts
2. **Accessibility**: Provides audio alternatives for visually impaired users
3. **Multitasking**: Consume news while performing other tasks
4. **Personalization**: Curate news feed based on interests

## Project Structure

```
sheepai/
├── backend/
│   ├── skratimeauth_auth_stack/    # Authentication infrastructure
│   └── skratimenews_stack/         # News and audio infrastructure
└── web/                            # React frontend application
```

## Development

The project uses modern DevOps practices with Docker support for local development and AWS CDK for cloud deployment. The frontend is containerized for easy setup, while the backend uses infrastructure as code for reproducible deployments.