import os
import json
import uuid
import base64
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import boto3
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute
from pydantic import BaseModel, ValidationError, Field
from aws_lambda_powertools import Logger

# Environment variables
TABLE_NAME = os.environ["TABLE_NAME"]
AUDIO_BUCKET = os.environ["AUDIO_BUCKET"]
AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")
PRESIGNED_URL_EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY", "3600"))  # 1 hour default

# Polly configuration
POLLY_VOICE_ID = os.environ.get("POLLY_VOICE_ID", "Joanna")
POLLY_ENGINE = os.environ.get("POLLY_ENGINE", "neural")  # neural or standard
POLLY_MAX_CHARS = 3000  # AWS Polly limit per request

# AWS clients
polly_client = boto3.client("polly", region_name=AWS_REGION)
s3_client = boto3.client("s3", region_name=AWS_REGION)

logger = Logger(service="SkratimenewsAudioLambda")


class SkratimenewsModel(Model):
    """DynamoDB model for news items"""
    class Meta:
        table_name = TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    title = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    category_id = UnicodeAttribute(null=True)
    picture_url = UnicodeAttribute(null=True)


class GenerateAudioRequest(BaseModel):
    """Request schema for audio generation"""
    news_ids: List[str] = Field(..., min_items=1, max_items=20, description="List of news post IDs to convert to audio")
    voice_id: Optional[str] = Field(None, description="Polly voice ID (default: Joanna)")
    engine: Optional[str] = Field(None, description="Polly engine: neural or standard (default: neural)")
    separator_text: Optional[str] = Field(
        "Next article.",
        description="Text to insert between multiple news articles"
    )


class AudioGenerationResult(BaseModel):
    """Response schema for audio generation"""
    audio_url: str
    duration_estimate_seconds: Optional[int] = None
    news_items_count: int
    missing_ids: List[str] = []
    s3_key: str
    expires_at: str


def fetch_news_items(news_ids: List[str]) -> tuple[List[Dict], List[str]]:
    """
    Fetch news items from DynamoDB by IDs.

    Args:
        news_ids: List of news item IDs to fetch

    Returns:
        Tuple of (found_items, missing_ids)
    """
    found_items = []
    missing_ids = []

    for news_id in news_ids:
        try:
            item = SkratimenewsModel.get(news_id)
            found_items.append({
                "id": item.id,
                "title": item.title or "",
                "summary": item.summary or ""
            })
            logger.debug("Fetched news item", extra={"id": news_id})
        except SkratimenewsModel.DoesNotExist:
            missing_ids.append(news_id)
            logger.warning("News item not found", extra={"id": news_id})

    return found_items, missing_ids


def prepare_text_for_speech(news_items: List[Dict], separator_text: str) -> str:
    """
    Prepare combined text from news items for speech synthesis.

    Args:
        news_items: List of news item dictionaries
        separator_text: Text to insert between articles

    Returns:
        Combined text ready for Polly
    """
    text_parts = []

    for item in news_items:
        title = item.get("title", "").strip()
        summary = item.get("summary", "").strip()

        # Format: "Title. Summary."
        article_text = ""
        if title:
            article_text += f"{title}. "
        if summary:
            article_text += summary

        if article_text:
            text_parts.append(article_text.strip())

    # Join with separator
    combined_text = f" {separator_text} ".join(text_parts)

    logger.info(
        "Prepared text for speech",
        extra={
            "total_length": len(combined_text),
            "article_count": len(text_parts)
        }
    )

    return combined_text


def chunk_text(text: str, max_chars: int = POLLY_MAX_CHARS) -> List[str]:
    """
    Split text into chunks that fit within Polly's character limit.
    Tries to split at sentence boundaries.

    Args:
        text: Text to chunk
        max_chars: Maximum characters per chunk

    Returns:
        List of text chunks
    """
    if len(text) <= max_chars:
        return [text]

    chunks = []
    current_chunk = ""

    # Split by sentences (simple approach)
    sentences = text.replace("! ", "!|").replace("? ", "?|").replace(". ", ".|").split("|")

    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 <= max_chars:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "

    if current_chunk:
        chunks.append(current_chunk.strip())

    logger.info("Text chunked", extra={"chunk_count": len(chunks)})
    return chunks


def synthesize_speech(text: str, voice_id: str, engine: str) -> bytes:
    """
    Synthesize speech using AWS Polly for potentially long text.
    Handles text chunking if needed and combines audio streams.

    Args:
        text: Text to convert to speech
        voice_id: Polly voice ID
        engine: Polly engine (neural or standard)

    Returns:
        Combined audio data as bytes

    Raises:
        Exception: If Polly synthesis fails
    """
    chunks = chunk_text(text)
    audio_streams = []

    for i, chunk in enumerate(chunks):
        logger.info(
            "Synthesizing chunk",
            extra={
                "chunk_index": i + 1,
                "total_chunks": len(chunks),
                "chunk_length": len(chunk)
            }
        )

        try:
            response = polly_client.synthesize_speech(
                Text=chunk,
                OutputFormat="mp3",
                VoiceId=voice_id,
                Engine=engine,
                TextType="text"
            )

            audio_stream = response["AudioStream"].read()
            audio_streams.append(audio_stream)

        except Exception as e:
            logger.error(
                "Polly synthesis failed for chunk",
                extra={
                    "chunk_index": i + 1,
                    "error": str(e)
                }
            )
            raise Exception(f"Speech synthesis failed for chunk {i + 1}: {str(e)}")

    # Combine audio streams
    # Note: For production, you might want to use a proper audio library
    # to ensure seamless concatenation. This simple approach works for MP3.
    combined_audio = b"".join(audio_streams)

    logger.info(
        "Audio synthesis complete",
        extra={
            "total_size_bytes": len(combined_audio),
            "chunks_combined": len(audio_streams)
        }
    )

    return combined_audio


def upload_to_s3(audio_data: bytes, bucket: str) -> str:
    """
    Upload audio data to S3.

    Args:
        audio_data: Audio bytes to upload
        bucket: S3 bucket name

    Returns:
        S3 key of uploaded file

    Raises:
        Exception: If S3 upload fails
    """
    # Generate unique S3 key with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    s3_key = f"audio/{timestamp}_{uuid.uuid4()}.mp3"

    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=audio_data,
            ContentType="audio/mpeg",
            Metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "source": "skratimenews-tts"
            }
        )

        logger.info(
            "Audio uploaded to S3",
            extra={
                "bucket": bucket,
                "key": s3_key,
                "size_bytes": len(audio_data)
            }
        )

        return s3_key

    except Exception as e:
        logger.error(
            "S3 upload failed",
            extra={
                "bucket": bucket,
                "key": s3_key,
                "error": str(e)
            }
        )
        raise Exception(f"Failed to upload audio to S3: {str(e)}")


def generate_presigned_url(bucket: str, key: str, expiry: int) -> str:
    """
    Generate presigned URL for S3 object.

    Args:
        bucket: S3 bucket name
        key: S3 object key
        expiry: URL expiry time in seconds

    Returns:
        Presigned URL
    """
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiry
        )

        logger.info(
            "Presigned URL generated",
            extra={
                "bucket": bucket,
                "key": key,
                "expiry_seconds": expiry
            }
        )

        return url

    except Exception as e:
        logger.error(
            "Failed to generate presigned URL",
            extra={
                "bucket": bucket,
                "key": key,
                "error": str(e)
            }
        )
        raise Exception(f"Failed to generate presigned URL: {str(e)}")


def estimate_audio_duration(text: str, words_per_minute: int = 150) -> int:
    """
    Estimate audio duration based on text length.

    Args:
        text: Text to estimate duration for
        words_per_minute: Average speaking speed

    Returns:
        Estimated duration in seconds
    """
    word_count = len(text.split())
    duration_minutes = word_count / words_per_minute
    duration_seconds = int(duration_minutes * 60)
    return duration_seconds


def handler(event, context):
    """
    Lambda handler for generating audio from news posts.

    Expected input:
    {
        "news_ids": ["id1", "id2", "id3"],
        "voice_id": "Joanna",  # optional
        "engine": "neural",  # optional
        "separator_text": "Next article."  # optional
    }

    Returns presigned URL to generated audio file.
    """
    logger.info("Received audio generation request", extra={"event": event})

    try:
        # Parse request body
        body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            body = base64.b64decode(body).decode("utf-8")
            logger.debug("Decoded base64 body")

        payload = json.loads(body)
        logger.debug("Parsed JSON payload", extra={"payload": payload})

        # Validate request
        try:
            request_data = GenerateAudioRequest(**payload)
        except ValidationError as e:
            logger.warning("Request validation failed", extra={"error": str(e)})
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Invalid request",
                    "details": e.errors()
                })
            }

        # Fetch news items
        news_items, missing_ids = fetch_news_items(request_data.news_ids)

        if not news_items:
            logger.warning("No news items found")
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "error": "No news items found",
                    "missing_ids": missing_ids
                })
            }

        # Prepare text for speech
        combined_text = prepare_text_for_speech(
            news_items,
            request_data.separator_text
        )

        if not combined_text.strip():
            logger.warning("No text content available for synthesis")
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "No text content available for speech synthesis"
                })
            }

        # Use provided voice settings or defaults
        voice_id = request_data.voice_id or POLLY_VOICE_ID
        engine = request_data.engine or POLLY_ENGINE

        # Synthesize speech
        try:
            audio_data = synthesize_speech(combined_text, voice_id, engine)
        except Exception as e:
            logger.error("Speech synthesis failed", extra={"error": str(e)})
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "error": "Speech synthesis failed",
                    "details": str(e)
                })
            }

        # Upload to S3
        try:
            s3_key = upload_to_s3(audio_data, AUDIO_BUCKET)
        except Exception as e:
            logger.error("S3 upload failed", extra={"error": str(e)})
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "error": "Failed to save audio file",
                    "details": str(e)
                })
            }

        # Generate presigned URL
        try:
            presigned_url = generate_presigned_url(
                AUDIO_BUCKET,
                s3_key,
                PRESIGNED_URL_EXPIRY
            )
        except Exception as e:
            logger.error("Failed to generate presigned URL", extra={"error": str(e)})
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "error": "Failed to generate download URL",
                    "details": str(e)
                })
            }

        # Calculate expiry timestamp
        expires_at = (
            datetime.utcnow() + timedelta(seconds=PRESIGNED_URL_EXPIRY)
        ).isoformat() + "Z"

        # Estimate duration
        duration_estimate = estimate_audio_duration(combined_text)

        # Build response
        result = AudioGenerationResult(
            audio_url=presigned_url,
            duration_estimate_seconds=duration_estimate,
            news_items_count=len(news_items),
            missing_ids=missing_ids,
            s3_key=s3_key,
            expires_at=expires_at
        )

        logger.info(
            "Audio generation completed successfully",
            extra={
                "news_items_count": len(news_items),
                "missing_ids_count": len(missing_ids),
                "s3_key": s3_key
            }
        )

        return {
            "statusCode": 200,
            "body": json.dumps(result.dict()),
            "headers": {
                "Content-Type": "application/json"
            }
        }

    except Exception as e:
        logger.error("Unhandled exception", extra={"error": str(e)}, exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Internal server error",
                "details": str(e)
            })
        }
