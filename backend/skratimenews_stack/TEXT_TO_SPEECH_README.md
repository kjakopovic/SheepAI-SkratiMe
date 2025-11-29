# Text-to-Speech API Documentation

## Overview

The text-to-speech feature allows you to convert news posts into audio format using AWS Polly. This feature fetches news items from DynamoDB, synthesizes speech, and uploads the resulting MP3 file to S3.

## API Endpoint

**Endpoint:** `POST /news/audio`

**Authentication:** Requires Cognito User Pool authentication (same as other news endpoints)

**Request Body:**
```json
{
  "news_ids": ["news-id-1", "news-id-2", "news-id-3"]
}
```

**Response:**
```json
{
  "audio_url": "https://s3.amazonaws.com/...",
  "news_count": 3,
  "message": "Audio generated successfully"
}
```

## Architecture Components

### 1. Lambda Function
- **File:** `lambdas/generate_audio_skratimenews.py`
- **Runtime:** Python 3.12
- **Timeout:** 120 seconds
- **Memory:** 512 MB
- **Handler:** `generate_audio_skratimenews.handler`

### 2. S3 Bucket
- **Purpose:** Store generated MP3 audio files
- **Encryption:** S3-managed encryption (SSE-S3)
- **Public Access:** Blocked (uses presigned URLs)
- **Lifecycle:** Audio files auto-delete after 7 days
- **CORS:** Enabled for GET/HEAD methods

### 3. IAM Permissions
The Lambda function has the following permissions:
- **DynamoDB:** Read access to news table
- **S3:** Put and read access to audio bucket
- **Polly:** SynthesizeSpeech permission
- **CloudWatch:** Logging (automatic)

## How It Works

### Step-by-Step Process

1. **Request Validation**
   - Validates that `news_ids` is a non-empty array
   - Uses Pydantic for schema validation

2. **Fetch News Items**
   - Retrieves each news item from DynamoDB
   - Returns 404 error if any news item doesn't exist
   - Logs missing IDs for debugging

3. **Text Preparation**
   - Extracts title and summary from each news item
   - Formats as: "Article 1. [Title]. [Summary]"
   - Adds 1-second pauses between articles using SSML

4. **Speech Synthesis**
   - Uses AWS Polly with neural engine for high-quality voice
   - Default voice: Joanna (configurable via environment variable)
   - Automatically handles text longer than 3000 characters by:
     - Splitting at sentence boundaries
     - Synthesizing multiple chunks
     - Combining audio chunks

5. **S3 Upload**
   - Generates unique filename: `news_audio_{timestamp}_{hash}.mp3`
   - Uploads with proper content type (audio/mpeg)
   - Stores metadata (news IDs, generation timestamp)

6. **Presigned URL Generation**
   - Creates presigned URL valid for 24 hours
   - Allows frontend to access audio without authentication
   - URL expires automatically for security

## Configuration

### Environment Variables

The Lambda function uses these environment variables (set automatically by CDK):

- `TABLE_NAME`: DynamoDB table name
- `AUDIO_BUCKET_NAME`: S3 bucket for audio files
- `POLLY_VOICE_ID`: Voice to use (default: "Joanna")

### Available Polly Voices

You can change the voice by modifying the CDK stack. Popular options:

**English (US):**
- Joanna (Female, Neural)
- Matthew (Male, Neural)
- Kendra (Female, Neural)
- Joey (Male, Neural)

**English (UK):**
- Amy (Female, Neural)
- Brian (Male, Neural)
- Emma (Female, Neural)

**Other Languages:**
- Supports 60+ voices across 30+ languages
- See AWS Polly documentation for full list

To change the voice, edit `app.py`:
```python
environment={
    "POLLY_VOICE_ID": "Matthew",  # Change to desired voice
    ...
}
```

## Usage Examples

### cURL Example

```bash
# First, get authentication token from Cognito
TOKEN="your-cognito-id-token"

# Generate audio for single news post
curl -X POST https://your-api-gateway.execute-api.eu-central-1.amazonaws.com/prod/news/audio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"news_ids": ["abc-123"]}'

# Generate audio for multiple news posts
curl -X POST https://your-api-gateway.execute-api.eu-central-1.amazonaws.com/prod/news/audio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"news_ids": ["abc-123", "def-456", "ghi-789"]}'
```

### JavaScript/TypeScript Example

```typescript
async function generateNewsAudio(newsIds: string[], authToken: string) {
  const response = await fetch(
    'https://your-api-gateway.execute-api.eu-central-1.amazonaws.com/prod/news/audio',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ news_ids: newsIds }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to generate audio: ${response.statusText}`);
  }

  const data = await response.json();
  return data.audio_url;
}

// Usage
const audioUrl = await generateNewsAudio(['news-id-1', 'news-id-2'], idToken);
// Play audio using HTML5 audio element
const audio = new Audio(audioUrl);
audio.play();
```

### Python Example

```python
import requests

def generate_news_audio(news_ids: list, auth_token: str) -> str:
    """Generate audio from news posts."""
    url = "https://your-api-gateway.execute-api.eu-central-1.amazonaws.com/prod/news/audio"

    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        },
        json={"news_ids": news_ids}
    )

    response.raise_for_status()
    data = response.json()
    return data["audio_url"]

# Usage
audio_url = generate_news_audio(["news-id-1", "news-id-2"], id_token)
print(f"Audio available at: {audio_url}")
```

## Error Handling

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid request: news_ids is required"
}
```

**404 Not Found:**
```json
{
  "error": "News items not found: abc-123, def-456"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error: [error details]"
}
```

### Common Issues

1. **News items not found**
   - Ensure all provided IDs exist in DynamoDB
   - Check CloudWatch logs for specific missing IDs

2. **Timeout errors**
   - Lambda timeout is 120 seconds
   - Consider reducing number of news items per request
   - Very long articles may need optimization

3. **Polly character limit**
   - Automatically handled by text splitting
   - Maximum ~100,000 characters total (practical limit)

4. **S3 access denied**
   - Check IAM permissions are correctly applied
   - Verify bucket exists and is in same region

## Cost Considerations

### AWS Polly Pricing (as of 2025)
- Neural voices: $16 per 1 million characters
- Standard voices: $4 per 1 million characters
- Example: 1000 characters = ~$0.016 with neural voice

### S3 Storage Pricing
- Storage: ~$0.023/GB per month
- Audio files auto-delete after 7 days (configurable)
- Average MP3: ~1 MB per minute of audio
- Example: 100 audio files (~100 MB) = ~$0.002/month

### Lambda Pricing
- Compute: $0.0000166667 per GB-second
- 512 MB, 30-second execution = ~$0.00025
- Free tier: 1 million requests/month

### Data Transfer
- Presigned URL downloads: Standard S3 transfer costs
- First 100 GB/month free
- Then $0.09/GB

## Monitoring and Logging

### CloudWatch Logs

All Lambda executions are logged to CloudWatch. Log groups:
- `/aws/lambda/SkratimenewsStack-GenerateAudioSkratimenewsLambda-*`

### Key Log Events

The Lambda uses structured logging with these events:
- `Received event`: Initial request
- `Fetched news item`: Each DynamoDB fetch
- `Prepared text for speech`: Text preparation complete
- `Split text into chunks`: When text exceeds Polly limit
- `Synthesizing chunk`: Each Polly API call
- `Speech synthesis complete`: Audio generation done
- `Uploading to S3`: Before S3 upload
- `Audio uploaded to S3 successfully`: Upload complete
- `Generated presigned URL`: Final step

### CloudWatch Metrics

Monitor these metrics:
- **Invocations**: Number of requests
- **Duration**: Execution time (should be under 120s)
- **Errors**: Failed requests
- **Throttles**: Rate limit hits

### Alarms (Recommended)

Set up CloudWatch alarms for:
- Error rate > 5%
- Duration > 100 seconds
- Throttles > 0

## Deployment

### Prerequisites

1. AWS CDK installed
2. AWS credentials configured
3. Python 3.12 runtime available
4. Existing DynamoDB table and Cognito User Pool

### Deploy Steps

```bash
# Navigate to stack directory
cd backend/skratimenews_stack

# Install dependencies (if needed)
pip install -r requirements.txt

# Deploy stack
cdk deploy SkratimenewsStack

# Note the outputs:
# - ApiEndpoint: Your API Gateway URL
# - AudioBucketName: S3 bucket name
```

### Verify Deployment

```bash
# Check Lambda function exists
aws lambda get-function --function-name SkratimenewsStack-GenerateAudioSkratimenewsLambda-*

# Check S3 bucket exists
aws s3 ls | grep skratimenews

# Test endpoint (replace with your values)
curl -X POST https://your-api.execute-api.eu-central-1.amazonaws.com/prod/news/audio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"news_ids": ["test-id"]}'
```

## Testing

### Unit Testing

Create `test_generate_audio.py`:

```python
import json
import pytest
from moto import mock_dynamodb, mock_s3, mock_polly
from lambdas.generate_audio_skratimenews import handler

@mock_dynamodb
@mock_s3
@mock_polly
def test_generate_audio_success():
    # Setup mocks...
    event = {
        "body": json.dumps({"news_ids": ["test-id"]})
    }

    response = handler(event, {})

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "audio_url" in body
```

### Integration Testing

```bash
# Create test news item
aws dynamodb put-item \
  --table-name SkratimenewsTable \
  --item '{
    "id": {"S": "test-123"},
    "title": {"S": "Test Article"},
    "summary": {"S": "This is a test summary."}
  }'

# Generate audio
curl -X POST $API_ENDPOINT/news/audio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"news_ids": ["test-123"]}'

# Clean up
aws dynamodb delete-item \
  --table-name SkratimenewsTable \
  --key '{"id": {"S": "test-123"}}'
```

## Security Best Practices

1. **Authentication**
   - All requests require valid Cognito token
   - Tokens expire according to User Pool settings

2. **S3 Access**
   - Bucket blocks all public access
   - Presigned URLs provide temporary access (24 hours)
   - CORS configured to allow frontend access

3. **IAM Least Privilege**
   - Lambda has minimal required permissions
   - Read-only DynamoDB access
   - Bucket-specific S3 permissions

4. **Encryption**
   - S3 objects encrypted at rest (SSE-S3)
   - HTTPS required for all API calls
   - Presigned URLs use HTTPS

5. **Input Validation**
   - Pydantic validates request schema
   - Empty news_ids array rejected
   - Invalid IDs return 404 error

## Optimization Tips

### Performance

1. **Reduce Cold Starts**
   - Consider provisioned concurrency for high-traffic
   - Current memory (512 MB) balances cost and performance

2. **Batch Processing**
   - Process multiple news items in single request
   - More efficient than individual requests

3. **Caching**
   - Consider caching audio for popular news combinations
   - Use S3 object tags to identify frequently accessed files

### Cost Optimization

1. **Voice Selection**
   - Standard voices are 75% cheaper than neural
   - Neural voices sound more natural

2. **Lifecycle Management**
   - Current setting: 7-day expiration
   - Adjust based on actual usage patterns

3. **Text Optimization**
   - Shorter text = lower Polly costs
   - Consider summarization for very long articles

## Future Enhancements

Potential improvements:
1. Support for multiple languages
2. Voice selection via API parameter
3. Speaking rate and pitch control
4. Background music or intro/outro
5. Caching of frequently requested audio
6. Webhook notifications when audio is ready
7. Support for SSML markup in news content
8. Batch job processing for generating all news audio nightly

## Troubleshooting

### Check CloudWatch Logs

```bash
# Get latest log stream
aws logs tail /aws/lambda/SkratimenewsStack-GenerateAudioSkratimenewsLambda-* --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/SkratimenewsStack-GenerateAudioSkratimenewsLambda-* \
  --filter-pattern "ERROR"
```

### Verify IAM Permissions

```bash
# Get Lambda role
aws lambda get-function --function-name SkratimenewsStack-GenerateAudioSkratimenewsLambda-* \
  --query 'Configuration.Role'

# Check role policies
aws iam list-attached-role-policies --role-name <role-name>
aws iam list-role-policies --role-name <role-name>
```

### Test Polly Access

```bash
# Verify Polly works
aws polly synthesize-speech \
  --text "Hello world" \
  --output-format mp3 \
  --voice-id Joanna \
  test-output.mp3
```

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error messages
2. Verify all IAM permissions are correctly configured
3. Ensure DynamoDB table and S3 bucket exist
4. Test with minimal payload (single news ID)
5. Review AWS service quotas (Polly, Lambda, S3)

## References

- [AWS Polly Documentation](https://docs.aws.amazon.com/polly/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [SSML Reference](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html)
- [Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)
