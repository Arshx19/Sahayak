import logging
from typing import Optional, Any
from .config import MONGODB_URI, MONGO_DB_NAME

logger = logging.getLogger("sahayak.db")

_async_client: Optional[Any] = None
_sync_client: Optional[Any] = None


def get_async_client():
    """
    Get or initialize the AsyncIOMotorClient singleton for FastAPI async handlers.
    Requires motor package.
    """
    global _async_client
    if _async_client is None:
        try:
            import os
            from motor.motor_asyncio import AsyncIOMotorClient
            logger.info("Initializing AsyncIOMotorClient connection...")
            timeout_ms = int(os.getenv("MONGO_TIMEOUT_MS", "5000"))
            _async_client = AsyncIOMotorClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=timeout_ms,
            )
        except ImportError:
            raise ImportError(
                "Motor is required for async MongoDB support. Run: pip install motor"
            )
    return _async_client


def get_async_db():
    """Return the async MongoDB database instance."""
    client = get_async_client()
    return client[MONGO_DB_NAME]


def get_sync_client():
    """
    Get or initialize the synchronous MongoClient for seeding scripts and CLI tasks.
    Requires pymongo package.
    """
    global _sync_client
    if _sync_client is None:
        try:
            import os
            from pymongo import MongoClient
            logger.info("Initializing synchronous MongoClient connection...")
            timeout_ms = int(os.getenv("MONGO_TIMEOUT_MS", "5000"))
            _sync_client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=timeout_ms,
            )
        except ImportError:
            raise ImportError(
                "PyMongo is required for synchronous MongoDB operations. Run: pip install pymongo"
            )
    return _sync_client


def get_sync_db():
    """Return the synchronous MongoDB database instance."""
    client = get_sync_client()
    return client[MONGO_DB_NAME]


async def get_db():
    """
    FastAPI dependency injection helper:
    Example usage in FastAPI routes:
        @router.get('/schemes')
        async def list_schemes(db = Depends(get_db)):
            ...
    """
    db = get_async_db()
    yield db


async def ping_database() -> dict:
    """
    Check connectivity to the MongoDB instance.
    Returns status dict with latency and server info if successful.
    """
    try:
        db = get_async_db()
        # Run a quick ping command
        result = await db.command("ping")
        return {"status": "connected", "database": MONGO_DB_NAME, "ping": result}
    except Exception as exc:
        logger.error(f"MongoDB ping failed: {exc}")
        return {"status": "error", "message": str(exc), "database": MONGO_DB_NAME}


def close_connections():
    """Close both async and sync clients gracefully on application shutdown."""
    global _async_client, _sync_client
    if _async_client:
        _async_client.close()
        _async_client = None
        logger.info("AsyncIOMotorClient closed.")
    if _sync_client:
        _sync_client.close()
        _sync_client = None
        logger.info("Sync MongoClient closed.")
