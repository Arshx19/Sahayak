"""SAHAYAK - AI & Intelligence Layer Service.

Standalone FastAPI microservice and CLI entrypoint for:
- Document feature extraction & OCR pipeline (/ai/extract)
- Document classification (/ai/classify)
- Deterministic rules evaluation (/ai/evaluate)
- Unified profile synthesis & consistency checking (/ai/merge-profile)
- Scheme ranking & prioritization (/ai/rank-schemes)
"""

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure 'backend' and 'backend/AI' are in Python search path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Extraction pipeline imports
try:
    from extraction.pipeline import extract_certificate_features
    from extraction.classifier import classify_document_text
    from rules_engine.evaluator import SchemeEvaluator
    from rules_engine.profile_merger import (
        UnifiedApplicantProfile,
        merge_extracted_documents,
    )
    from rules_engine.ranker import rank_schemes
except ImportError:
    from AI.extraction.pipeline import extract_certificate_features
    from AI.extraction.classifier import classify_document_text
    from AI.rules_engine.evaluator import SchemeEvaluator
    from AI.rules_engine.profile_merger import (
        UnifiedApplicantProfile,
        merge_extracted_documents,
    )
    from AI.rules_engine.ranker import rank_schemes

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s")
logger = logging.getLogger("sahayak.ai.service")

# =============================================================================
# APPLICATION DEFINITION
# =============================================================================
app = FastAPI(
    title="SAHAYAK AI & Rules Engine Service",
    description=(
        "Microservice for document OCR feature extraction, profile synthesizing, "
        "and deterministic explainable welfare scheme eligibility evaluation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class ClassifyRequest(BaseModel):
    text: str = Field(..., description="Raw text extracted from document")


class EvaluateRequest(BaseModel):
    profile: Dict[str, Any] = Field(..., description="Applicant profile dictionary")
    scheme_rule: Dict[str, Any] = Field(..., description="Scheme eligibility rule criteria")


class MergeProfileRequest(BaseModel):
    extracted_docs: Dict[str, Any] = Field(
        ...,
        description="Dictionary mapping doc_type (e.g. 'aadhaar', 'income_certificate') to extraction results",
    )


class RankSchemesRequest(BaseModel):
    evaluations: List[Dict[str, Any]] = Field(..., description="List of evaluated scheme outcomes")
    schemes_metadata: Optional[Dict[str, Dict[str, Any]]] = Field(
        default_factory=dict,
        description="Scheme metadata mapping keyed by scheme_id",
    )


# =============================================================================
# ENDPOINTS
# =============================================================================
@app.get("/", summary="Root Health Status")
@app.get("/health", summary="Health Check")
async def health_check() -> Dict[str, Any]:
    """Return health status of the AI microservice."""
    return {
        "service": "SAHAYAK AI Layer",
        "status": "healthy",
        "version": "1.0.0",
        "modules": {
            "document_extraction": "active",
            "classifier": "active",
            "rules_engine": "active",
            "profile_merger": "active",
            "ranker": "active",
        },
    }


@app.post("/ai/classify", summary="Classify Document Text")
async def classify_text(payload: ClassifyRequest) -> Dict[str, Any]:
    """Classify text against recognized Indian document types (Aadhaar, PAN, Land Record, etc.)."""
    doc_type, confidence = classify_document_text(payload.text)
    return {
        "success": True,
        "doc_type": doc_type,
        "confidence": confidence,
    }


@app.post("/ai/extract", summary="Extract Features from Document")
async def extract_document(
    file: UploadFile = File(...),
    hint_doc_type: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """Run full 7-stage extraction pipeline on uploaded document bytes."""
    try:
        file_bytes = await file.read()
        res = extract_certificate_features(
            file_bytes=file_bytes,
            file_name=file.filename or "",
            hint_doc_type=hint_doc_type,
        )
        return {
            "success": True,
            "filename": file.filename,
            "data": res,
        }
    except Exception as exc:
        logger.error(f"Error extracting features: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failure: {str(exc)}",
        )


@app.post("/ai/evaluate", summary="Deterministic Scheme Eligibility Evaluation")
async def evaluate_eligibility(payload: EvaluateRequest) -> Dict[str, Any]:
    """Evaluate applicant profile against scheme eligibility rules."""
    try:
        # Convert dict to UnifiedApplicantProfile instance if needed
        profile_inst = UnifiedApplicantProfile()
        for k, v in payload.profile.items():
            if hasattr(profile_inst, k):
                setattr(profile_inst, k, v)

        result = SchemeEvaluator.evaluate_scheme(
            scheme=payload.scheme_rule,
            profile=profile_inst,
        )
        return {
            "success": True,
            "data": result,
        }
    except Exception as exc:
        logger.error(f"Evaluation error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(exc)}",
        )


@app.post("/ai/merge-profile", summary="Merge Multiple Extracted Docs into Profile")
async def merge_profile(payload: MergeProfileRequest) -> Dict[str, Any]:
    """Synthesize demographic attributes from multiple documents with cross-checks."""
    try:
        raw_docs = payload.extracted_docs
        if isinstance(raw_docs, dict):
            # Check if dict of { "aadhaar": { ...fields... } } or single doc dict
            if "doc_type" in raw_docs or "fields" in raw_docs:
                docs_list = [raw_docs]
            else:
                docs_list = []
                for k, v in raw_docs.items():
                    if isinstance(v, dict):
                        doc_item = dict(v)
                        if "doc_type" not in doc_item:
                            doc_item["doc_type"] = k
                        docs_list.append(doc_item)
        elif isinstance(raw_docs, list):
            docs_list = raw_docs
        else:
            docs_list = []

        profile = merge_extracted_documents(docs_list)
        return {
            "success": True,
            "profile": profile.to_dict(),
            "conflicts": profile.cross_doc_conflicts,
            "warnings": profile.warnings,
            "uploaded_documents": profile.uploaded_documents,
            "unverified_fields": profile.unverified_fields,
        }
    except Exception as exc:
        logger.error(f"Profile merge error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile merge failed: {str(exc)}",
        )


@app.post("/ai/rank-schemes", summary="Rank Evaluated Schemes")
async def rank_evaluated_schemes(payload: RankSchemesRequest) -> Dict[str, Any]:
    """Rank evaluated schemes by eligibility status, benefit amounts, and match scores."""
    try:
        ranked = rank_schemes(payload.evaluations, payload.schemes_metadata or {})
        return {
            "success": True,
            "count": len(ranked),
            "data": ranked,
        }
    except Exception as exc:
        logger.error(f"Ranking error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ranking failed: {str(exc)}",
        )


# =============================================================================
# CLI RUNNER
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="SAHAYAK AI Layer Service & CLI Runner")
    parser.add_argument("--serve", action="store_true", help="Start FastAPI AI microservice server")
    parser.add_argument("--host", default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8001, help="Port to listen on (default: 8001)")
    parser.add_argument("--reload", action="store_true", help="Enable uvicorn hot-reload")
    parser.add_argument("--test-eval", action="store_true", help="Run deterministic rules test")
    args = parser.parse_args()

    if args.test_eval:
        print("\n--- Testing Deterministic Rules Engine ---")
        p = UnifiedApplicantProfile()
        p.state = "Maharashtra"
        p.annual_family_income = 180000
        p.gender = "male"
        p.caste_category = "OBC"
        p.has_aadhaar = True
        p.has_land_record = True
        p.land_area_acres = 1.5

        test_rule = {
            "scheme_id": "pm_kisan",
            "target_population": "all",
            "conditions": [
                {"field": "land_area_acres", "operator": "<=", "value": 5.0, "description": "Landholding <= 5 acres"},
                {"field": "annual_family_income", "operator": "<=", "value": 300000, "description": "Income <= 3 Lakh"},
            ],
            "required_documents": ["aadhaar", "land_record"],
            "exclusions": ["income_tax_payer", "constitutional_post_holder"],
        }
        res = SchemeEvaluator.evaluate_scheme(test_rule, p)
        print("Evaluation Status:", res["status"])
        print("Passed Conditions:", len(res["passed"]))
        print("Failed Conditions:", len(res["failed"]))
        print("Missing Documents:", res["missing_documents"])
        print("Result Summary:", res)
        return

    # Default to starting the server
    import uvicorn
    print(f"Starting SAHAYAK AI Layer Server on http://{args.host}:{args.port}")
    uvicorn.run("main:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
