# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SheepAI-SkratiMe is a full-stack serverless application with:
- **Frontend**: React TypeScript web app (in `web/ShadcnTanstack/`)
- **Backend**: AWS CDK infrastructure with two separate stacks (in `backend/`)
  - Authentication stack using AWS Cognito
  - News CRUD API stack using DynamoDB

## Development Commands

### Frontend (web/ShadcnTanstack/)

```bash
# Install dependencies (uses pnpm)
cd web/ShadcnTanstack
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm compile

# Preview production build
pnpm preview

# Linting
pnpm lint

# Format checking and fixing
pnpm prettier:check
pnpm prettier:fix
```

### Backend (AWS CDK)

The backend consists of two independent CDK stacks:

**Authentication Stack** (`backend/skratimeauth_auth_stack/`):
```bash
cd backend/skratimeauth_auth_stack
cdk synth       # Synthesize CloudFormation template
cdk deploy      # Deploy stack to AWS
cdk destroy     # Remove stack from AWS
```

**News Stack** (`backend/skratimenews_stack/`):
```bash
cd backend/skratimenews_stack
cdk synth
cdk deploy
cdk destroy
```

## Architecture

### Backend Architecture

The backend uses AWS CDK (Python) to define infrastructure as code with two independent stacks:

#### 1. Authentication Stack (`skratimeauth_auth_stack`)
- **Cognito User Pool**: Handles user registration and authentication with email verification
- **Lambda Functions**:
  - `Register`: Located in `./Register/lambda_handler.py` - handles user registration via Cognito
  - `Login`: Located in `./Login/lambda_handler.py` - handles user authentication
- **API Gateway**: REST API with two endpoints:
  - `POST /register` - user registration
  - `POST /login` - user login
- **Environment Variables**: Lambda functions receive `USER_POOL_ID` and `USER_POOL_CLIENT_ID`
- **Dependencies**: Lambda functions use `aws-lambda-powertools` (bundled at deployment)
- **Exports**: User Pool ID is exported as `SkratimeauthUserPoolId` for cross-stack references

#### 2. News Stack (`skratimenews_stack`)
- **DynamoDB Table**: Partition key is `id` (STRING), using pay-per-request billing
- **Cognito Authorization**: All endpoints protected by Cognito User Pools authorizer using the imported User Pool (ID: `eu-central-1_Ih32d60MT`)
- **Lambda Functions** (all in `./lambdas/`):
  - `create_skratimenews.py` - Create news items
  - `get_skratimenews.py` - Retrieve news items
  - `update_skratimenews.py` - Update news items
  - `delete_skratimenews.py` - Delete news items
- **API Gateway**: REST API with Cognito authorization:
  - `POST /news` - create item (protected)
  - `GET /news` - list items (protected)
  - `PUT /news/{id}` - update item (protected)
  - `DELETE /news/{id}` - delete item (protected)
- **Dependencies**: Lambda functions use `pynamodb`, `pydantic`, and `aws-lambda-powertools` (bundled at deployment)
- **Environment Variables**: All lambdas receive `TABLE_NAME`

**Key Backend Patterns**:
- Lambda functions are bundled with dependencies at CDK deployment time using container images
- The News stack imports the Auth stack's User Pool by ID for authorization
- All API endpoints use CORS with `ALL_ORIGINS`, `ALL_METHODS`, and `DEFAULT_HEADERS`
- Lambda timeout is 30 seconds for auth functions

### Frontend Architecture

The frontend is a React TypeScript SPA using modern tooling:

#### Core Stack
- **Build Tool**: Vite with SWC for fast compilation
- **UI Framework**: React 19 with React Router v7 for routing
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: TanStack Query (React Query v5) for server state
- **Forms**: React Hook Form with Yup and Zod validation
- **HTTP Client**: `ky` for API requests
- **Internationalization**: i18next with browser language detection and HTTP backend

#### Project Structure
- **`src/routes/`**: Routing configuration
  - `Router.tsx` - Main router component with route wrappers
  - `routes.tsx` - Route definitions with protection and role-based access
  - Uses custom `Wrapper.Route` component for protected routes
- **`src/features/`**: Feature-based organization
  - `auth/` - Authentication feature with API, components, pages, hooks, types, and utils
  - `dashboard/` - Dashboard feature
  - Each feature exports via index.ts barrel files
- **`src/context/`**: React Context providers
  - `UserContext.ts` - User authentication state
  - Initialized via `Wrapper.InitProvider` in Router
- **`src/components/`**: Shared UI components
- **`src/common/`**: Shared utilities, constants, and errors
- **`src/config.ts`**: Application configuration (reads `VITE_APP_API_URL` from environment)
- **`src/hooks/`**: Shared custom React hooks
- **`src/utils/`**: Shared utility functions
- **`src/lib/`**: Third-party library configurations
- **`src/models/`**: Data models and types
- **`src/types/`**: TypeScript type definitions
- **`src/assets/`**: Static assets

#### Key Frontend Patterns
- Uses `@/` path alias for imports (maps to `./src/`)
- Error boundaries wrap the entire app via `Wrapper.ErrorBoundary`
- Protected routes with role-based access control
- Toast notifications via `react-toastify`
- React Query DevTools enabled in development
- Strict mode enabled
- Suspense boundaries with loading fallbacks
- Husky for git hooks (runs postinstall)

#### Configuration Files
- **TypeScript**: Uses ESNext target with strict mode, path aliases, and JSX support
- **Vite**: Configured with React SWC, SVGR for SVG components, and Tailwind CSS v4
- **ESLint**: Airbnb config with TypeScript, React, and Prettier integration
- **Prettier**: Custom sort imports plugin from Trivago

## Important Notes

### Backend
- The News stack hardcodes the User Pool ID from the Auth stack. If you redeploy the Auth stack, update the User Pool ID in `backend/skratimenews_stack/app.py:30`
- Lambda dependencies are installed during CDK synthesis, not during deployment
- Both stacks use `RemovalPolicy.DESTROY` for development - resources will be deleted on stack deletion

### Frontend
- Environment variables must be prefixed with `VITE_APP_` to be accessible
- The app expects `VITE_APP_API_URL` to be set for API communication
- Uses pnpm as the package manager (not npm or yarn)
- ESLint is configured with a maximum of 5 warnings
- The app uses both Yup and Zod for validation (consider consolidating)
