"""SAHAYAK - Database Layer Service & CLI Controller.

Standalone FastAPI microservice and CLI entrypoint for:
- MongoDB connection diagnostics and ping (/db/health)
- Collection inventory and document statistics (/db/status)
- Database seeding with indexes, schemes, rules, and demo users (/db/seed)
- Excel scheme ingestion (/db/ingest)
- Direct repository queries for schemes and users (/db/schemes, /db/users)
"""

import argparse
import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

# Ensure 'backend' and 'backend/DB' are in Python search path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

# Database layer imports
try:
    from config import (
        COLLECTION_USERS,
        COLLECTION_CITIZEN_PROFILES,
        COLLECTION_USER_DOCUMENTS,
        COLLECTION_SCHEMES,
        COLLECTION_SCHEME_RULES,
        COLLECTION_ELIGIBILITY_CHECKS,
        COLLECTION_NOTIFICATIONS,
        COLLECTION_GRIEVANCES,
        COLLECTION_AUDIT_LOGS,
        MONGO_DB_NAME,
        MONGODB_URI,
        get_db_settings,
    )
    from connection import (
        get_async_client,
        get_async_db,
        get_sync_client,
        get_sync_db,
        ping_database,
        close_connections,
    )
    from seed import run_seeder
    import crud
except ImportError:
    from DB.config import (
        COLLECTION_USERS,
        COLLECTION_CITIZEN_PROFILES,
        COLLECTION_USER_DOCUMENTS,
        COLLECTION_SCHEMES,
        COLLECTION_SCHEME_RULES,
        COLLECTION_ELIGIBILITY_CHECKS,
        COLLECTION_NOTIFICATIONS,
        COLLECTION_GRIEVANCES,
        COLLECTION_AUDIT_LOGS,
        MONGO_DB_NAME,
        MONGODB_URI,
        get_db_settings,
    )
    from DB.connection import (
        get_async_client,
        get_async_db,
        get_sync_client,
        get_sync_db,
        ping_database,
        close_connections,
    )
    from DB.seed import run_seeder
    from DB import crud

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s")
logger = logging.getLogger("sahayak.db.service")


# =============================================================================
# LIFESPAN CONTEXT MANAGER
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage startup database verification and graceful connection shutdown."""
    logger.info(f"Connecting to MongoDB at {MONGODB_URI} (DB: {MONGO_DB_NAME})")
    yield
    try:
        close_connections()
    except Exception:
        pass


# =============================================================================
# APPLICATION DEFINITION
# =============================================================================
app = FastAPI(
    title="SAHAYAK Database Layer Service",
    description=(
        "Microservice and administrative API for MongoDB collection inspection, "
        "indexing, seeding, and raw repository querying."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
async def get_collection_statistics() -> Dict[str, Any]:
    """Retrieve document counts and index summary across all core collections."""
    try:
        db = get_async_db()
        coll_names = [
            COLLECTION_USERS,
            COLLECTION_CITIZEN_PROFILES,
            COLLECTION_USER_DOCUMENTS,
            COLLECTION_SCHEMES,
            COLLECTION_SCHEME_RULES,
            COLLECTION_ELIGIBILITY_CHECKS,
            COLLECTION_NOTIFICATIONS,
            COLLECTION_GRIEVANCES,
            COLLECTION_AUDIT_LOGS,
        ]

        stats: Dict[str, int] = {}
        for c in coll_names:
            try:
                count = await db[c].count_documents({})
                stats[c] = count
            except Exception:
                stats[c] = -1

        # Check demo accounts
        users_coll = db[COLLECTION_USERS]
        demo_accounts = {}
        for role_email in ["admin@sahayak.gov.in", "officer@sahayak.gov.in", "citizen@sahayak.gov.in"]:
            u = await users_coll.find_one({"email": role_email})
            demo_accounts[role_email] = {
                "exists": bool(u),
                "role": u.get("role") if u else None,
                "name": u.get("name") if u else None,
            }

        return {
            "status": "connected",
            "database": MONGO_DB_NAME,
            "document_counts": stats,
            "demo_accounts": demo_accounts,
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": str(exc),
            "database": MONGO_DB_NAME,
        }


# =============================================================================
# ENDPOINTS
# =============================================================================
@app.get("/", summary="Root Service Health")
@app.get("/health", summary="Health Check")
@app.get("/db/health", summary="Database Ping & Latency")
async def db_health() -> Dict[str, Any]:
    """Check connectivity to MongoDB database."""
    res = await ping_database()
    return {
        "service": "SAHAYAK DB Layer",
        **res,
    }


@app.get("/db/status", summary="Collection Statistics & Demo Accounts")
async def db_status() -> Dict[str, Any]:
    """Return document count breakdown and verified demo user presence."""
    return await get_collection_statistics()


@app.post("/db/seed", summary="Trigger Database Seeding")
async def trigger_seed() -> Dict[str, Any]:
    """Run seeder to populate core schemes, rules, and demo accounts with indexes."""
    try:
        # Run seeder synchronously in thread
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run_seeder)
        stats = await get_collection_statistics()
        return {
            "success": True,
            "message": "Seeding completed successfully",
            "statistics": stats,
        }
    except Exception as exc:
        logger.error(f"Seeding failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Seeding failed: {str(exc)}",
        )


@app.post("/db/ingest", summary="Trigger Excel Scheme Ingestion")
async def trigger_ingest() -> Dict[str, Any]:
    """Ingest government schemes from official Excel workbook."""
    try:
        try:
            from ingest_excel_schemes import run_ingestion
        except ImportError:
            from DB.ingest_excel_schemes import run_ingestion

        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run_ingestion)
        return {
            "success": True,
            "message": "Excel schemes ingested successfully",
        }
    except Exception as exc:
        logger.error(f"Ingestion failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(exc)}",
        )


@app.get("/db/schemes", summary="Query Schemes from Database")
async def list_db_schemes(limit: int = Query(20, ge=1, le=100)) -> Dict[str, Any]:
    """Query raw scheme records from MongoDB."""
    try:
        db = get_async_db()
        cursor = db[COLLECTION_SCHEMES].find({}, {"_id": 0}).limit(limit)
        schemes = await cursor.to_list(length=limit)
        return {
            "success": True,
            "count": len(schemes),
            "data": schemes,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query schemes: {str(exc)}",
        )


@app.get("/db/users", summary="Query Users from Database (Sanitized)")
async def list_db_users(limit: int = Query(20, ge=1, le=50)) -> Dict[str, Any]:
    """Query user accounts from MongoDB with sensitive password hashes omitted."""
    try:
        db = get_async_db()
        cursor = db[COLLECTION_USERS].find({}, {"_id": 0, "password_hash": 0}).limit(limit)
        users = await cursor.to_list(length=limit)
        return {
            "success": True,
            "count": len(users),
            "data": users,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query users: {str(exc)}",
        )


# =============================================================================
# CLI RUNNER
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="SAHAYAK Database Layer Controller & Service")
    parser.add_argument("--ping", action="store_true", help="Ping MongoDB database")
    parser.add_argument("--status", action="store_true", help="Print collections document statistics")
    parser.add_argument("--seed", action="store_true", help="Run database seeder")
    parser.add_argument("--ingest", action="store_true", help="Run Excel scheme ingestion")
    parser.add_argument("--serve", action="store_true", help="Start FastAPI DB microservice")
    parser.add_argument("--host", default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8002, help="Port to listen on (default: 8002)")
    parser.add_argument("--reload", action="store_true", help="Enable uvicorn hot-reload")
    args = parser.parse_args()

    # 1. Ping
    if args.ping:
        import asyncio
        print("\n--- Pinging MongoDB ---")
        res = asyncio.run(ping_database())
        print("Result:", res)
        return

    # 2. Status
    if args.status:
        import asyncio
        print("\n=======================================================")
        print("         SAHAYAK MONGODB STATUS & INVENTORY            ")
        print("=======================================================")
        stats = asyncio.run(get_collection_statistics())
        if stats.get("status") == "connected":
            print(f"Target Database: {stats['database']}")
            print("\nCollection Breakdown:")
            for coll, count in stats.get("document_counts", {}).items():
                print(f"  - {coll:<25}: {count} documents")
            print("\nDemo Accounts Verification:")
            for email, info in stats.get("demo_accounts", {}).items():
                status_str = f"EXISTS (Role: {info['role']}, Name: {info['name']})" if info['exists'] else "MISSING"
                print(f"  - {email:<25}: {status_str}")
        else:
            print("Database Connection Error:", stats.get("message"))
        print("=======================================================\n")
        return

    # 3. Seed
    if args.seed:
        print("\n--- Running Database Seeder ---")
        run_seeder()
        print("Seeding finished successfully.")
        return

    # 4. Ingest
    if args.ingest:
        print("\n--- Ingesting Excel Schemes ---")
        try:
            from ingest_excel_schemes import run_ingestion
        except ImportError:
            from DB.ingest_excel_schemes import run_ingestion
        run_ingestion()
        print("Ingestion finished successfully.")
        return

    # 5. Default / Serve
    import uvicorn
    app_target = "main:app" if Path.cwd() == current_dir else "DB.main:app"
    print(f"Starting SAHAYAK DB Layer Server on http://{args.host}:{args.port}")
    if args.reload:
        uvicorn.run(app_target, host=args.host, port=args.port, reload=True)
    else:
        uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
