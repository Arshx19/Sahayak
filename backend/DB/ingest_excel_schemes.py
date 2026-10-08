"""Excel Scheme Ingestion & Rules Generator.

Parses Government_Schemes_India_2026_SIMPLIFIED.xlsx into:
1. backend/DB/seeds/schemes_data.json (Canonical CRUD repository seed)
2. backend/DB/seeds/enhanced_schemes.json (Data-driven Rules Engine seed with conditions & exclusions)
3. Optionally seeds MongoDB collections ('schemes' and 'scheme_rules') if --seed-db is provided.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import openpyxl


BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXCEL_PATH = BASE_DIR / "Government_Schemes_India_2026_SIMPLIFIED.xlsx"
SEEDS_DIR = BASE_DIR / "backend" / "DB" / "seeds"


def load_document_mappings(wb: openpyxl.Workbook) -> Dict[str, str]:
    """Load normalized code mapping from DOCUMENT_TYPES sheet."""
    doc_map = {
        "aadhaar card": "aadhaar",
        "pan card": "pan",
        "passport size photograph": "photograph",
        "bank account details": "bank_account",
        "address proof": "address_proof",
        "income certificate": "income_certificate",
        "caste certificate": "caste_certificate",
        "domicile certificate": "domicile_certificate",
        "ration card": "ration_bpl",
        "land ownership document": "land_record",
        "birth certificate of girl child": "birth_certificate",
        "educational qualification certificate": "marksheet",
        "mobile number": "mobile_number",
        "mgnrega job card": "mgnrega_job_card",
        "business registration / udyam registration": "udyam_registration",
        "vending certificate / id card": "vending_certificate",
        "mother-child protection card (mcp card)": "mcp_card",
        "project report": "project_report",
        "age proof": "birth_certificate",
        "disability certificate": "disability_certificate",
        "death certificate / medical disability certificate": "disability_certificate",
        "post-mortem report": "post_mortem_report",
        "electricity bill account id": "electricity_bill_id",
        "rental agreement": "rental_agreement",
        "degree/diploma passing certificate": "marksheet",
        "cap allotment letter": "cap_allotment_letter",
        "class 12 marksheet": "marksheet",
    }

    if "DOCUMENT_TYPES" in wb.sheetnames:
        sheet = wb["DOCUMENT_TYPES"]
        headers = [str(cell.value or "").strip().lower() for cell in sheet[1]]
        try:
            name_col = headers.index("canonical_document_name") + 1
            code_col = headers.index("normalized_code") + 1
            for r in range(2, sheet.max_row + 1):
                raw_name = sheet.cell(row=r, column=name_col).value
                code = sheet.cell(row=r, column=code_col).value
                if raw_name and code:
                    clean_name = str(raw_name).strip().lower()
                    clean_code = str(code).strip().lower()
                    if clean_code == "ration_card":
                        clean_code = "ration_bpl"
                    elif "marksheet" in clean_code or "educational" in clean_code or "degree" in clean_code:
                        clean_code = "marksheet"
                    doc_map[clean_name] = clean_code
        except ValueError:
            pass

    return doc_map


def parse_required_documents(raw_text: str, doc_map: Dict[str, str]) -> List[str]:
    """Parse pipe-separated document names into canonical normalized codes."""
    if not raw_text:
        return ["aadhaar"]

    docs = []
    tokens = [t.strip() for t in str(raw_text).split("|") if t.strip()]
    for token in tokens:
        clean = token.lower()
        matched = None
        for key, code in doc_map.items():
            if key in clean or clean in key:
                matched = code
                break
        if not matched:
            if "aadhaar" in clean:
                matched = "aadhaar"
            elif "pan" in clean:
                matched = "pan"
            elif "income" in clean:
                matched = "income_certificate"
            elif "caste" in clean:
                matched = "caste_certificate"
            elif "domicile" in clean or "residence" in clean:
                matched = "domicile_certificate"
            elif "mark" in clean or "education" in clean or "degree" in clean:
                matched = "marksheet"
            elif "disability" in clean or "pwd" in clean:
                matched = "disability_certificate"
            elif "ration" in clean or "bpl" in clean or "food" in clean:
                matched = "ration_bpl"
            elif "birth" in clean:
                matched = "birth_certificate"
            elif "land" in clean or "khatauni" in clean or "7/12" in clean:
                matched = "land_record"
            else:
                matched = clean.replace(" ", "_")
        if matched and matched not in docs:
            docs.append(matched)

    return docs if docs else ["aadhaar"]


def extract_benefit_summary(desc: str, name: str) -> Dict[str, Any]:
    """Extract financial entitlement and type from scheme description."""
    text = f"{name} {desc}"
    amt = 0
    b_type = "direct_benefit_transfer"

    # Search for monetary figures
    lakh_match = re.search(r"₹\s*([\d\.]+)\s*(?:lakh|lac)", text, re.IGNORECASE)
    thousand_match = re.search(r"₹\s*([\d,]+)", text)

    if lakh_match:
        try:
            val = float(lakh_match.group(1))
            amt = int(val * 100000)
        except ValueError:
            amt = 100000
    elif thousand_match:
        try:
            val_str = thousand_match.group(1).replace(",", "")
            amt = int(val_str)
        except ValueError:
            amt = 6000

    if "health" in text.lower() or "hospital" in text.lower() or "arogya" in text.lower():
        b_type = "health_insurance_cover"
        amt = amt or 500000
    elif "house" in text.lower() or "awas" in text.lower():
        b_type = "housing_grant"
        amt = amt or 120000
    elif "pension" in text.lower() or "vayoshri" in text.lower():
        b_type = "monthly_pension"
        amt = amt or 3000
    elif "scholarship" in text.lower() or "shikshan" in text.lower() or "laptop" in text.lower():
        b_type = "educational_assistance"
        amt = amt or 25000
    elif "loan" in text.lower() or "mudra" in text.lower() or "svanidhi" in text.lower():
        b_type = "subsidized_credit"
        amt = amt or 50000
    elif "lpg" in text.lower() or "ujjwala" in text.lower():
        b_type = "clean_energy_subsidy"
        amt = amt or 1600

    return {
        "type": b_type,
        "amount_inr": amt,
        "description": desc.split(".")[0].strip() if desc else "Government welfare entitlement",
    }


def build_rules_for_scheme(
    scheme_id: str,
    name: str,
    category: str,
    provider: str,
    state: str,
    eligibility_text: str,
    required_docs: List[str],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Constructs deterministic eligibility conditions and exclusions based on
    socio-economic criteria, age bounds, income ceilings, and document proofs.
    """
    conditions: List[Dict[str, Any]] = []
    exclusions: List[Dict[str, Any]] = []

    clean_elig = (eligibility_text or "").lower()
    clean_cat = (category or "").lower()
    sid = scheme_id.upper()

    # 1. State Domicile Check for State Schemes
    if provider.lower() == "state" and state and state.lower() != "all india":
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_state",
            "field": "state",
            "operator": "==",
            "value": state,
            "mandatory": True,
            "description": f"Permanent resident / domicile of {state}",
        })

    # 2. Category / Sector Specific Rules
    # FARMER SCHEMES
    if clean_cat == "farmer" or "farmer" in clean_elig:
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_farmer",
            "field": "occupation",
            "operator": "==",
            "value": "farmer",
            "mandatory": True,
            "description": "Applicant must be a practicing farmer or agricultural landholder",
        })
        if "landholding" in clean_elig or "cultivable" in clean_elig or "small and marginal" in clean_elig:
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_land",
                "field": "land_acres",
                "operator": "<=",
                "value": 5.0,
                "mandatory": False,
                "description": "Cultivable agricultural landholding up to 5.0 acres (small/marginal)",
            })
        exclusions.append({
            "exclusion_id": f"excl_{sid.lower()}_tax",
            "field": "is_income_tax_payer",
            "operator": "==",
            "value": True,
            "reason": "Institutional landholders and income tax paying households are excluded",
        })

    # WOMEN / GIRL CHILD SCHEMES
    if clean_cat == "women" or "woman" in clean_elig or "girl child" in clean_elig or "female" in clean_elig:
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_gender",
            "field": "gender",
            "operator": "==",
            "value": "female",
            "mandatory": True,
            "description": "Applicant must be female",
        })

        # Age bounds
        if "below 10" in clean_elig or sid == "CEN010":
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_age_child",
                "field": "age",
                "operator": "<=",
                "value": 10,
                "mandatory": True,
                "description": "Child age must be 10 years or younger",
            })
        elif "21 to 65" in clean_elig or "between 21 and 65" in clean_elig or sid == "MH001":
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_age_bracket",
                "field": "age",
                "operator": "between",
                "value": [21, 65],
                "mandatory": True,
                "description": "Age must be between 21 and 65 years",
            })
        elif "21 to 59" in clean_elig or sid == "OD001":
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_age_bracket",
                "field": "age",
                "operator": "between",
                "value": [21, 59],
                "mandatory": True,
                "description": "Age must be between 21 and 59 years",
            })
        elif "18" in clean_elig:
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_age_adult",
                "field": "age",
                "operator": ">=",
                "value": 18,
                "mandatory": True,
                "description": "Applicant must be an adult woman (aged 18+)",
            })

    # HEALTHCARE & BPL / SECC SCHEMES
    if clean_cat == "healthcare" or "bpl" in clean_elig or "nfsa" in clean_elig or "ration card" in clean_elig:
        if "ration_bpl" in required_docs:
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_ration",
                "field": "has_bpl_card",
                "operator": "==",
                "value": True,
                "mandatory": False,
                "description": "Family must hold a valid NFSA / State BPL ration card",
            })

    # STREET VENDORS / MSME / SELF-EMPLOYED
    if "street vendor" in clean_elig or "vending" in clean_elig or sid == "CEN007":
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_occ",
            "field": "occupation",
            "operator": "in",
            "value": ["street_vendor", "vendor", "hawker", "self_employed"],
            "mandatory": True,
            "description": "Must be engaged in urban street vending or self-employed trade",
        })

    # PENSION / SENIOR CITIZENS
    if "senior citizen" in clean_elig or "65 years" in clean_elig or sid == "MH004":
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_age_senior",
            "field": "age",
            "operator": ">=",
            "value": 65,
            "mandatory": True,
            "description": "Must be a senior citizen aged 65 years or above",
        })
    elif "60+" in clean_elig or "60 years" in clean_elig or sid == "OD004":
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_age_senior",
            "field": "age",
            "operator": ">=",
            "value": 60,
            "mandatory": True,
            "description": "Must be aged 60 years or above (or widow/differently-abled)",
        })
    elif "18 to 40" in clean_elig or sid in ("CEN005", "UP001"):
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_age_band",
            "field": "age",
            "operator": "between",
            "value": [18, 40],
            "mandatory": True,
            "description": "Applicant age must be between 18 and 40 years",
        })

    # EDUCATION & YOUTH SCHEMES
    if clean_cat == "education" or "student" in clean_elig or "marksheet" in required_docs:
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_edu",
            "field": "marks_percentage",
            "operator": ">=",
            "value": 50.0,
            "mandatory": False,
            "description": "Minimum passing academic record (50% or above)",
        })

    # INCOME THRESHOLD EXTRACTION
    inc_lakh = re.search(r"(?:income|family income)[^\d]{1,25}(?:₹|rs\.?)\s*([\d\.]+)\s*(?:lakh|lac)", clean_elig)
    inc_num = re.search(r"(?:income|family income)[^\d]{1,25}(?:₹|rs\.?)\s*([\d,]+)", clean_elig)

    if inc_lakh:
        try:
            val = float(inc_lakh.group(1))
            limit = int(val * 100000)
            conditions.append({
                "condition_id": f"cond_{sid.lower()}_inc",
                "field": "annual_income",
                "operator": "<=",
                "value": limit,
                "mandatory": True,
                "description": f"Annual family income must not exceed ₹{limit:,}",
            })
        except ValueError:
            pass
    elif inc_num:
        try:
            val_str = inc_num.group(1).replace(",", "")
            limit = int(val_str)
            if limit > 1000:
                conditions.append({
                    "condition_id": f"cond_{sid.lower()}_inc",
                    "field": "annual_income",
                    "operator": "<=",
                    "value": limit,
                    "mandatory": True,
                    "description": f"Annual family income must not exceed ₹{limit:,}",
                })
        except ValueError:
            pass

    # GENERAL EXCLUSIONS
    if "tax" in clean_elig or "income tax" in clean_elig:
        if not any(e.get("field") == "is_income_tax_payer" for e in exclusions):
            exclusions.append({
                "exclusion_id": f"excl_{sid.lower()}_it",
                "field": "is_income_tax_payer",
                "operator": "==",
                "value": True,
                "reason": "Income tax paying citizens or families are excluded",
            })

    # Default fallback condition if none matched
    if not conditions:
        conditions.append({
            "condition_id": f"cond_{sid.lower()}_gen",
            "field": "annual_income",
            "operator": "<=",
            "value": 500000,
            "mandatory": False,
            "description": "Annual household income within general eligibility threshold",
        })

    return conditions, exclusions


def ingest_excel_schemes(excel_path: Path) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Parse Excel workbook into CRUD schemes and Rules Engine enhanced schemes."""
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel workbook not found at: {excel_path}")

    wb = openpyxl.load_workbook(excel_path, data_only=True)
    doc_map = load_document_mappings(wb)

    sheet = wb["SCHEMES"]
    headers = [str(cell.value or "").strip().lower() for cell in sheet[1]]

    col_idx = {h: idx + 1 for idx, h in enumerate(headers)}

    crud_schemes: List[Dict[str, Any]] = []
    enhanced_schemes: List[Dict[str, Any]] = []

    for r in range(2, sheet.max_row + 1):
        sid = str(sheet.cell(row=r, column=col_idx.get("scheme_id", 1)).value or "").strip()
        if not sid:
            continue

        sname = str(sheet.cell(row=r, column=col_idx.get("scheme_name", 2)).value or "").strip()
        provider = str(sheet.cell(row=r, column=col_idx.get("provider", 3)).value or "Central").strip()
        state = str(sheet.cell(row=r, column=col_idx.get("state", 4)).value or "All India").strip()
        category = str(sheet.cell(row=r, column=col_idx.get("scheme_category", 5)).value or "General").strip()
        description = str(sheet.cell(row=r, column=col_idx.get("description", 6)).value or "").strip()
        eligibility = str(sheet.cell(row=r, column=col_idx.get("eligibility", 7)).value or "").strip()
        raw_docs = str(sheet.cell(row=r, column=col_idx.get("required_documents", 8)).value or "").strip()
        app_start = str(sheet.cell(row=r, column=col_idx.get("application_start", 9)).value or "Not specified").strip()
        app_end = str(sheet.cell(row=r, column=col_idx.get("application_end", 10)).value or "Not specified").strip()
        app_freq = str(sheet.cell(row=r, column=col_idx.get("application_frequency", 11)).value or "Continuous").strip()
        app_status = str(sheet.cell(row=r, column=col_idx.get("application_status", 12)).value or "Open").strip()
        app_process = str(sheet.cell(row=r, column=col_idx.get("application_process", 13)).value or "").strip()
        app_url = str(sheet.cell(row=r, column=col_idx.get("application_url", 14)).value or "").strip()
        official_source = str(sheet.cell(row=r, column=col_idx.get("official_source", 15)).value or "").strip()

        required_docs = parse_required_documents(raw_docs, doc_map)
        benefit_summary = extract_benefit_summary(description, sname)
        conditions, exclusions = build_rules_for_scheme(
            sid, sname, category, provider, state, eligibility, required_docs
        )

        applicable_states = ["ALL"] if state.lower() == "all india" or provider.lower() == "central" else [state]

        # 1. Canonical CRUD Scheme Object
        crud_obj = {
            "scheme_id": sid,
            "scheme_code": sid,
            "name": sname,
            "category": category,
            "scheme_type": provider,
            "provider": provider,
            "state": state,
            "applicable_states": applicable_states,
            "description": description,
            "benefits": description,
            "eligibility": eligibility,
            "required_documents": required_docs,
            "raw_required_documents": raw_docs,
            "timeline": {
                "application_start": app_start,
                "application_end": app_end,
                "application_frequency": app_freq,
                "application_status": app_status,
            },
            "application_start": app_start,
            "application_end": app_end,
            "application_frequency": app_freq,
            "application_status": app_status,
            "application_process": app_process,
            "application_url": app_url,
            "official_url": app_url or official_source,
            "official_source": official_source,
            "is_active": True,
            "status": "active",
            "version": "2.0",
        }
        crud_schemes.append(crud_obj)

        # 2. Enhanced Rules Engine Object
        enhanced_obj = {
            "scheme_id": sid,
            "scheme_code": sid,
            "name": sname,
            "ministry": f"Government of {state if provider.lower() == 'state' else 'India'}",
            "level": provider.lower(),
            "applicable_states": applicable_states,
            "applicable_districts": [],
            "rule_version": "2.0",
            "effective_from": "2026-01-01",
            "effective_to": "2026-12-31",
            "benefit_summary": benefit_summary,
            "required_documents": required_docs,
            "eligibility_conditions": conditions,
            "exclusions": exclusions,
        }
        enhanced_schemes.append(enhanced_obj)

    return crud_schemes, enhanced_schemes


def main():
    parser = argparse.ArgumentParser(description="Ingest simplified scheme rules from Excel into SAHAYAK seed datasets.")
    parser.add_argument("--excel", type=str, default=str(EXCEL_PATH), help="Path to Government_Schemes_India_2026_SIMPLIFIED.xlsx")
    parser.add_argument("--seed-db", action="store_true", help="Seed MongoDB database collections if running")
    args = parser.parse_args()

    excel_file = Path(args.excel)
    print(f"Loading schemes workbook from: {excel_file}...")
    crud_schemes, enhanced_schemes = ingest_excel_schemes(excel_file)
    print(f"Extracted {len(crud_schemes)} schemes successfully!")

    SEEDS_DIR.mkdir(parents=True, exist_ok=True)
    crud_out = SEEDS_DIR / "schemes_data.json"
    enhanced_out = SEEDS_DIR / "enhanced_schemes.json"

    with open(crud_out, "w", encoding="utf-8") as f:
        json.dump(crud_schemes, f, indent=2, ensure_ascii=False)
    print(f"Saved CRUD repository seed to: {crud_out}")

    with open(enhanced_out, "w", encoding="utf-8") as f:
        json.dump(enhanced_schemes, f, indent=2, ensure_ascii=False)
    print(f"Saved Rules Engine seed to: {enhanced_out}")

    if args.seed_db:
        print("Connecting to MongoDB to seed collections...")
        try:
            import asyncio
            from backend.DB.connection import get_db

            async def _seed():
                db = await get_db()
                if db is not None:
                    await db.schemes.delete_many({})
                    await db.schemes.insert_many(crud_schemes)
                    print(f"Seeded {len(crud_schemes)} documents into 'schemes' collection.")
                else:
                    print("MongoDB client returned None. Skipping direct DB write.")

            asyncio.run(_seed())
        except Exception as e:
            print(f"Note: MongoDB direct write skipped ({e}). Static seeds are ready for API consumption.")

    print("\nIngestion Summary:")
    print(f"- Total Schemes Processed: {len(crud_schemes)}")
    print(f"- Central Schemes: {sum(1 for s in crud_schemes if s['provider'] == 'Central')}")
    print(f"- State Schemes: {sum(1 for s in crud_schemes if s['provider'] == 'State')}")
    print("- Ready for UI and Rules Engine consumption!")


if __name__ == "__main__":
    main()
