"""
storage.py — S3-compatible Object Storage Service (MinIO / AWS S3 / DigitalOcean Spaces)

Uses boto3 under the hood.  Switching from MinIO to a cloud provider only requires
changing four environment variables:
    MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL

Object key namespace (multi-tenant isolation):
    plum-documents/
        business_{id}/
            documents/
                {document_id}/
                    {filename}
"""

import logging
import re
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError, EndpointResolutionError

from backend.utils.config import settings

logger = logging.getLogger("plum.ai.storage")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sanitize_filename(filename: str) -> str:
    """Remove characters that are unsafe in S3 object keys."""
    # Replace whitespace and special chars with underscores
    return re.sub(r"[^\w.\-]", "_", filename)


# ---------------------------------------------------------------------------
# StorageService
# ---------------------------------------------------------------------------

class StorageService:
    """
    Thin wrapper around a boto3 S3 client configured for MinIO (or any
    S3-compatible endpoint).  All public methods are synchronous and safe to
    call from FastAPI background tasks.
    """

    def __init__(self) -> None:
        self._client = None  # lazy-initialised on first use
        self._bucket = settings.MINIO_BUCKET_NAME

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_client(self):
        """Return a cached boto3 S3 client, creating it on first call."""
        if self._client is not None:
            return self._client

        endpoint_url = (
            f"{'https' if settings.MINIO_USE_SSL else 'http'}://{settings.MINIO_ENDPOINT}"
        )

        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",  # required by boto3, ignored by MinIO
        )
        logger.info(f"MinIO client initialised → endpoint: {endpoint_url}")
        return self._client

    def _ensure_bucket(self) -> bool:
        """Create the bucket if it doesn't exist. Returns True on success."""
        client = self._get_client()
        try:
            client.head_bucket(Bucket=self._bucket)
            return True
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code in ("404", "NoSuchBucket"):
                try:
                    client.create_bucket(Bucket=self._bucket)
                    logger.info(f"Created MinIO bucket: {self._bucket}")
                    return True
                except ClientError as create_err:
                    logger.error(f"Failed to create bucket '{self._bucket}': {create_err}")
                    return False
            else:
                logger.error(f"Bucket check failed: {e}")
                return False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @staticmethod
    def build_object_key(business_id: int, document_id: int, filename: str) -> str:
        """
        Build a namespaced object key.
        Example: business_3/documents/42/quarterly_report.pdf
        """
        safe_name = _sanitize_filename(filename)
        return f"business_{business_id}/documents/{document_id}/{safe_name}"

    def upload_file(
        self,
        file_bytes: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> Optional[str]:
        """
        Upload raw bytes to MinIO.

        Args:
            file_bytes:   Raw file content.
            object_key:   Destination key (use build_object_key()).
            content_type: MIME type for HTTP Content-Type header.

        Returns:
            The object_key on success, or None on failure.
        """
        try:
            client = self._get_client()
            self._ensure_bucket()

            client.put_object(
                Bucket=self._bucket,
                Key=object_key,
                Body=file_bytes,
                ContentType=content_type,
                ContentLength=len(file_bytes),
            )
            logger.info(
                f"Uploaded {len(file_bytes):,} bytes → "
                f"s3://{self._bucket}/{object_key}"
            )
            return object_key

        except (ClientError, EndpointResolutionError, Exception) as exc:
            logger.warning(
                f"MinIO upload failed for key '{object_key}': {exc}. "
                "File ingestion will continue without persistent storage."
            )
            return None

    def get_presigned_url(
        self,
        object_key: str,
        expires_in: int = 3600,
    ) -> Optional[str]:
        """
        Generate a presigned GET URL for the given object.

        The internal endpoint (minio:9000) is replaced with the public-facing
        URL so the link works in the browser outside of Docker.

        Args:
            object_key: The S3 object key.
            expires_in: URL validity in seconds (default: 1 hour).

        Returns:
            A presigned URL string, or None on failure.
        """
        try:
            client = self._get_client()
            url: str = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )
            # Rewrite the internal Docker endpoint to the public URL
            internal = (
                f"{'https' if settings.MINIO_USE_SSL else 'http'}://{settings.MINIO_ENDPOINT}"
            )
            public_url = url.replace(internal, settings.MINIO_PUBLIC_URL.rstrip("/"))
            return public_url

        except (ClientError, Exception) as exc:
            logger.warning(f"Presigned URL generation failed for '{object_key}': {exc}")
            return None

    def delete_file(self, object_key: str) -> bool:
        """
        Delete an object from MinIO.

        Args:
            object_key: The S3 object key returned by upload_file().

        Returns:
            True on success (or object didn't exist), False on error.
        """
        if not object_key:
            return True  # nothing to delete

        try:
            client = self._get_client()
            client.delete_object(Bucket=self._bucket, Key=object_key)
            logger.info(f"Deleted s3://{self._bucket}/{object_key}")
            return True

        except (ClientError, Exception) as exc:
            logger.warning(f"MinIO delete failed for '{object_key}': {exc}")
            return False

    def health_check(self) -> dict:
        """Return a dict describing MinIO connectivity status."""
        try:
            client = self._get_client()
            client.head_bucket(Bucket=self._bucket)
            return {"status": "healthy", "bucket": self._bucket}
        except Exception as exc:
            return {"status": "unavailable", "error": str(exc)}


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

# Instantiated once at module import time; reused across all requests.
storage_service = StorageService()
