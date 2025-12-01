# Categories and User Personal Categories - Complete Implementation Guide

## Overview

This guide documents the complete implementation of the Categories CRUD API and User Personal Categories management system for the SheepAI-SkratiMe project. The solution provides a comprehensive category management system with user-specific category preferences stored in Cognito.

## Architecture Overview

### Data Model Design

The implementation uses a hybrid approach for data storage:

1. **Categories Master Data**: Stored in DynamoDB (`SkratimecategoriesTable`)
   - Centralized category repository
   - All users can reference the same category definitions
   - Efficient querying by ID or name

2. **User Personal Categories**: Stored in Cognito User Pool custom attributes
   - Each user has a `personal_categories` attribute containing an array of category IDs
   - Leverages existing authentication infrastructure
   - Eliminates need for a separate user preferences table
   - Automatically available in JWT claims after authentication

3. **News-Category Association**: Stored in News DynamoDB table
   - Each news item has a `category_id` field
   - Global Secondary Index (GSI) enables efficient querying by category

### Stack Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Skratimeauth Auth Stack                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Cognito User Pool                                     │  │
│  │ - Custom Attribute: personal_categories (JSON array)  │  │
│  │ - Custom Attribute: user_interests                    │  │
│  │ - Custom Attribute: notion_link                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  API Endpoints:                                              │
│  - POST /register                                            │
│  - POST /login                                               │
│  - GET /users/me (NEW - get user profile)                   │
│  - PATCH /users/me/personal-categories (NEW - update)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Skratimecategories Stack                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ DynamoDB Table: Categories                            │  │
│  │ - Partition Key: id (STRING)                          │  │
│  │ - Attributes: name, description                       │  │
│  │ - GSI: category-name-index (on name)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  API Endpoints:                                              │
│  - POST /categories                                          │
│  - GET /categories (with filtering: ids, names)             │
│  - PUT /categories/{id}                                      │
│  - DELETE /categories/{id}                                   │
│  - GET /news-by-categories?category_ids=...&names=...       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Skratimenews Stack                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ DynamoDB Table: News                                  │  │
│  │ - Partition Key: id (STRING)                          │  │
│  │ - Attributes: title, summary, category_id, etc.       │  │
│  │ - GSI: news-category-index (on category_id)           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  API Endpoints:                                              │
│  - POST /news                                                │
│  - GET /news?category_id=...                                │
│  - PUT /news/{id}                                            │
│  - DELETE /news/{id}                                         │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Categories Stack (Skratimecategories)

All endpoints require Cognito authentication. Include the JWT token in the `Authorization` header.

#### 1. Create Category

**Endpoint**: `POST /categories`

**Request Body**:
```json
{
  "name": "Technology",
  "description": "Tech news and updates"
}
```

**Response** (201):
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "uuid-generated-id",
    "name": "Technology",
    "description": "Tech news and updates"
  }
}
```

**Error Responses**:
- `409`: Category with name already exists
- `400`: Validation error
- `500`: Internal server error

---

#### 2. Get Categories (with Advanced Filtering)

**Endpoint**: `GET /categories`

**Query Parameters**:
- `id` - Get single category by ID
- `ids` - Comma-separated list of category IDs (e.g., `id1,id2,id3`)
- `name` - Get single category by name
- `names` - Comma-separated list of category names (e.g., `Tech,Sports,News`)
- `last_evaluated_key` - For pagination (when fetching all)

**Examples**:

Get single category:
```
GET /categories?id=abc-123
```

Get multiple categories by IDs:
```
GET /categories?ids=abc-123,def-456,ghi-789
```

Get single category by name:
```
GET /categories?name=Technology
```

Get multiple categories by names:
```
GET /categories?names=Technology,Sports,Business
```

Get all categories (paginated):
```
GET /categories
```

**Response** (200):

Single category:
```json
{
  "id": "abc-123",
  "name": "Technology",
  "description": "Tech news and updates"
}
```

Multiple categories:
```json
{
  "items": [
    {
      "id": "abc-123",
      "name": "Technology",
      "description": "Tech news"
    },
    {
      "id": "def-456",
      "name": "Sports",
      "description": "Sports updates"
    }
  ],
  "count": 2
}
```

All categories (paginated):
```json
{
  "items": [...],
  "count": 10,
  "last_evaluated_key": "eyJ...base64..." // null if no more pages
}
```

---

#### 3. Update Category

**Endpoint**: `PUT /categories/{id}`

**Request Body** (all fields optional):
```json
{
  "name": "Updated Technology",
  "description": "Updated description"
}
```

**Response** (200):
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": "abc-123",
    "name": "Updated Technology",
    "description": "Updated description"
  }
}
```

**Error Responses**:
- `404`: Category not found
- `409`: Category name already exists
- `400`: Validation error
- `500`: Internal server error

---

#### 4. Delete Category

**Endpoint**: `DELETE /categories/{id}`

**Response** (200):
```json
{
  "message": "Category deleted successfully",
  "id": "abc-123"
}
```

**Error Responses**:
- `404`: Category not found
- `500`: Internal server error

**Note**: Consider implementing a check to prevent deletion of categories currently associated with news items.

---

#### 5. Get News by Categories

**Endpoint**: `GET /news-by-categories`

**Query Parameters**:
- `category_ids` - Comma-separated list of category IDs
- `category_names` - Comma-separated list of category names
- `limit` - Maximum news items per category (default: 50, max: 50)

**Examples**:

Get news by category IDs:
```
GET /news-by-categories?category_ids=abc-123,def-456
```

Get news by category names:
```
GET /news-by-categories?category_names=Technology,Sports
```

Mix of IDs and names with limit:
```
GET /news-by-categories?category_ids=abc-123&category_names=Sports&limit=10
```

**Response** (200):
```json
{
  "categories": {
    "abc-123": {
      "category": {
        "id": "abc-123",
        "name": "Technology",
        "description": "Tech news"
      },
      "news": [
        {
          "id": "news-1",
          "title": "AI Breakthrough",
          "summary": "New AI model...",
          "category_id": "abc-123",
          "picture_url": "https://..."
        }
      ],
      "count": 1
    },
    "def-456": {
      "category": {
        "id": "def-456",
        "name": "Sports",
        "description": "Sports updates"
      },
      "news": [...],
      "count": 5
    }
  },
  "total_news_count": 6
}
```

**Error Responses**:
- `400`: No category filter provided
- `500`: Internal server error

---

### User Profile Stack (Skratimeauth)

#### 6. Get User Profile

**Endpoint**: `GET /users/me`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200):
```json
{
  "username": "user@example.com",
  "email": "user@example.com",
  "name": "John Doe",
  "email_verified": true,
  "notion_link": "https://notion.so/...",
  "user_interests": ["AI", "Technology"],
  "personal_categories": ["abc-123", "def-456"],
  "user_status": "CONFIRMED",
  "enabled": true
}
```

**Error Responses**:
- `401`: Unauthorized (invalid or missing token)
- `404`: User not found
- `500`: Internal server error

---

#### 7. Update Personal Categories

**Endpoint**: `PATCH /users/me/personal-categories`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
```json
{
  "personal_categories": ["abc-123", "def-456", "ghi-789"]
}
```

To clear all personal categories:
```json
{
  "personal_categories": []
}
```

**Response** (200):
```json
{
  "message": "Personal categories updated successfully",
  "personal_categories": ["abc-123", "def-456", "ghi-789"]
}
```

**Error Responses**:
- `400`: Invalid request body or validation error
- `401`: Unauthorized (invalid or missing token)
- `404`: User not found
- `500`: Internal server error

---

## Common Workflows

### Workflow 1: User Sets Their Personal Categories

1. **User logs in** → Receives JWT token
2. **Fetch available categories**:
   ```
   GET /categories
   ```
3. **User selects categories** → Frontend stores selected IDs
4. **Update personal categories**:
   ```
   PATCH /users/me/personal-categories
   Body: { "personal_categories": ["id1", "id2", "id3"] }
   ```

---

### Workflow 2: Display News for User's Personal Categories

1. **Get user profile** to retrieve personal categories:
   ```
   GET /users/me
   ```
   Response includes: `"personal_categories": ["id1", "id2", "id3"]`

2. **Fetch news for those categories**:
   ```
   GET /news-by-categories?category_ids=id1,id2,id3
   ```

---

### Workflow 3: Display News with Category Names (Not Just IDs)

1. **Fetch news**:
   ```
   GET /news?category_id=abc-123
   ```

2. **Fetch category details**:
   ```
   GET /categories?id=abc-123
   ```

3. **Display news with category name** from the fetched category data

**Alternative (More Efficient)**:
```
GET /news-by-categories?category_ids=abc-123
```
This returns both news items and category details in a single request.

---

### Workflow 4: User Browses Categories by Name

1. **Search for specific categories**:
   ```
   GET /categories?names=Technology,Sports,Business
   ```

2. **Display categories** to user

3. **User selects categories** → Update personal preferences:
   ```
   PATCH /users/me/personal-categories
   Body: { "personal_categories": [<selected-ids>] }
   ```

---

## Authentication

All API endpoints (except `/register` and `/login`) require Cognito authentication.

### Getting a JWT Token

1. **Register** (if new user):
   ```
   POST /register
   Body: {
     "email": "user@example.com",
     "password": "SecurePass123",
     "name": "John Doe",
     "user_interests": ["AI", "Tech"]
   }
   ```

2. **Login**:
   ```
   POST /login
   Body: {
     "email": "user@example.com",
     "password": "SecurePass123"
   }
   ```

   Response includes:
   ```json
   {
     "IdToken": "eyJ...",
     "AccessToken": "eyJ...",
     "RefreshToken": "eyJ..."
   }
   ```

3. **Use IdToken in subsequent requests**:
   ```
   Authorization: Bearer <IdToken>
   ```

### Extracting User Information from JWT

The Lambda functions automatically extract the user identity from the JWT token in the `Authorization` header. The Cognito authorizer validates the token, and the user information is available in:

```python
claims = event['requestContext']['authorizer']['claims']
username = claims.get('cognito:username') or claims.get('sub')
```

No need to pass user ID manually - it's automatically extracted from the authenticated token.

---

## Data Relationships

### Category → News (One-to-Many)

```
Category (id: "abc-123")
    ├── News Item 1 (category_id: "abc-123")
    ├── News Item 2 (category_id: "abc-123")
    └── News Item 3 (category_id: "abc-123")
```

### User → Categories (Many-to-Many via personal_categories)

```
User (personal_categories: ["abc-123", "def-456"])
    ├── Category: Technology (id: "abc-123")
    └── Category: Sports (id: "def-456")
```

---

## IAM Permissions

### Categories Stack Lambda Functions

**Required DynamoDB Permissions**:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": [
    "arn:aws:dynamodb:{region}:{account}:table/SkratimecategoriesTable",
    "arn:aws:dynamodb:{region}:{account}:table/SkratimecategoriesTable/index/*"
  ]
}
```

**For get_news_by_categories Lambda** (also needs News table access):
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:GetItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:{region}:{account}:table/SkratimenewsTable",
    "arn:aws:dynamodb:{region}:{account}:table/SkratimenewsTable/index/*"
  ]
}
```

### User Profile Lambda Functions

**Required Cognito Permissions**:
```json
{
  "Effect": "Allow",
  "Action": [
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminUpdateUserAttributes"
  ],
  "Resource": "arn:aws:cognito-idp:{region}:{account}:userpool/{user-pool-id}"
}
```

---

## Deployment

### Prerequisites

- AWS CDK installed and configured
- Python 3.12+
- Valid AWS credentials

### Deploy Categories Stack

```bash
cd backend/skratimecategories_stack
cdk deploy
```

This creates:
- DynamoDB table with GSI
- 5 Lambda functions (create, get, update, delete, get_news_by_categories)
- API Gateway with Cognito authorizer
- Necessary IAM roles and policies

### Deploy Updated Auth Stack

```bash
cd backend/skratimeauth_auth_stack
cdk deploy
```

This creates/updates:
- Cognito User Pool with custom attributes
- 4 Lambda functions (register, login, update_personal_categories, get_user_profile)
- API Gateway with public and protected endpoints
- Cognito authorizer for protected endpoints

### Verify Deployment

After deployment, CDK outputs the API endpoints:

```
Outputs:
SkratimeauthAuthStack.AuthApiEndpoint = https://xxx.execute-api.eu-central-1.amazonaws.com/auth
SkratimecategoriesStack.CategoriesApiEndpoint = https://yyy.execute-api.eu-central-1.amazonaws.com/prod
```

---

## Implementation Files

### Categories Stack

**Location**: `/Users/leonard/Documents/coding/sheepai/backend/skratimecategories_stack/`

**Files**:
- `app.py` - CDK stack definition
- `lambdas/create_category.py` - Create category handler
- `lambdas/get_category.py` - Get categories with filtering
- `lambdas/update_category.py` - Update category handler
- `lambdas/delete_category.py` - Delete category handler
- `lambdas/get_news_by_categories.py` - Get news filtered by categories

### Auth Stack (User Profile)

**Location**: `/Users/leonard/Documents/coding/sheepai/backend/skratimeauth_auth_stack/`

**Files**:
- `app.py` - CDK stack definition (updated)
- `UpdatePersonalCategories/lambda_handler.py` - Update personal categories
- `GetUserProfile/lambda_handler.py` - Get user profile

---

## Best Practices

### 1. Category ID Storage Format

Personal categories are stored as JSON array in Cognito:
```json
["category-id-1", "category-id-2", "category-id-3"]
```

**Max Length**: 2048 characters (Cognito custom attribute limit)

**Recommendation**: Store only category IDs, not full category objects. Fetch full category details from the Categories API when needed.

### 2. Error Handling

All Lambda functions implement comprehensive error handling:
- Input validation with Pydantic schemas
- Specific error responses for different scenarios
- Structured logging with AWS Lambda Powertools
- Client-friendly error messages

### 3. Security

- **Authentication**: All endpoints (except login/register) require valid JWT
- **Authorization**: Users can only access their own profile data
- **Least Privilege IAM**: Lambda functions have minimal required permissions
- **CORS**: Configured for web application access

### 4. Performance Optimization

- **GSI for Efficient Queries**: Both tables use GSIs for filtering
- **Batch Operations**: `get_news_by_categories` fetches news for multiple categories in one request
- **Pagination**: Implemented for large result sets
- **Pay-per-request Billing**: DynamoDB tables use on-demand billing

### 5. Data Consistency

- **Category Name Uniqueness**: Create/Update operations check for duplicate names
- **Graceful Degradation**: If a category is deleted, news items still reference it (consider implementing cleanup or soft-delete)

---

## Future Enhancements

### 1. Category Validation on Personal Categories Update

Currently, users can add any category ID to their personal_categories. Consider validating that the category IDs exist:

```python
# In update_personal_categories Lambda
for category_id in personal_categories:
    try:
        CategoryModel.get(category_id)
    except CategoryModel.DoesNotExist:
        return error_response(400, f"Category {category_id} does not exist")
```

### 2. Get News for User's Personal Categories

Add a convenience endpoint:
```
GET /users/me/news
```

This would:
1. Get user's personal_categories
2. Fetch news for those categories
3. Return combined results

### 3. Category Subscription Notifications

When news is posted in a user's personal categories, send notifications:
- Email via SES
- Push notifications via SNS
- In-app notifications

### 4. Category Analytics

Track category popularity:
- Number of users subscribed to each category
- Most viewed categories
- Category trends over time

### 5. Hierarchical Categories

Support parent-child category relationships:
```
Technology
  ├── AI/ML
  ├── Web Development
  └── Mobile Apps
```

### 6. User Category Preferences

Extend beyond just IDs to include preferences:
```json
{
  "personal_categories": [
    {
      "id": "abc-123",
      "notification_enabled": true,
      "priority": "high"
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Category name already exists" when creating

**Solution**: Category names must be unique. Check existing categories or update the existing one.

### Issue: "Unauthorized" when calling protected endpoints

**Solution**: Ensure you're including the JWT token in the Authorization header:
```
Authorization: Bearer <IdToken>
```

### Issue: Personal categories not updating

**Solution**:
1. Verify the request body format is correct (array of strings)
2. Check CloudWatch logs for the Lambda function
3. Ensure the user exists in Cognito

### Issue: News not appearing in get_news_by_categories

**Solution**:
1. Verify the news items have the correct `category_id` field
2. Check that the GSI `news-category-index` exists on the News table
3. Ensure the Lambda has read permissions on both tables

---

## Testing

### Manual Testing with curl

**1. Register a user**:
```bash
curl -X POST https://xxx.execute-api.eu-central-1.amazonaws.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User",
    "user_interests": ["Technology", "AI"]
  }'
```

**2. Login**:
```bash
curl -X POST https://xxx.execute-api.eu-central-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the `IdToken` from the response.

**3. Create categories**:
```bash
curl -X POST https://yyy.execute-api.eu-central-1.amazonaws.com/prod/categories \
  -H "Authorization: Bearer <IdToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "description": "Tech news and updates"
  }'
```

**4. Get user profile**:
```bash
curl https://xxx.execute-api.eu-central-1.amazonaws.com/auth/users/me \
  -H "Authorization: Bearer <IdToken>"
```

**5. Update personal categories**:
```bash
curl -X PATCH https://xxx.execute-api.eu-central-1.amazonaws.com/auth/users/me/personal-categories \
  -H "Authorization: Bearer <IdToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "personal_categories": ["<category-id>"]
  }'
```

**6. Get news for categories**:
```bash
curl "https://yyy.execute-api.eu-central-1.amazonaws.com/prod/news-by-categories?category_ids=<category-id>" \
  -H "Authorization: Bearer <IdToken>"
```

---

## Summary

This implementation provides:

1. **Complete Category CRUD**: Full management of categories with advanced filtering
2. **User Personal Categories**: User-specific category preferences in Cognito
3. **News-Category Integration**: Efficient querying of news by categories
4. **Secure Authentication**: Cognito-based JWT authentication
5. **Production-Ready**: Error handling, logging, IAM policies, and CORS support
6. **Scalable Architecture**: Serverless, pay-per-use, auto-scaling

The solution follows AWS best practices and integrates seamlessly with the existing authentication and news stacks.
