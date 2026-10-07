# 🤝 Integration Prompt for Backend Teammate (Antigravity Assistant)

> **Instructions for Teammate**: Copy and paste the prompt below into your Antigravity AI assistant working on the `backend/` or `feature/crud-api` branch.

---

```markdown
Hi Antigravity! I am working on the Backend (CRUD/API) layer of the SAHAYAK project.
Our Database teammate has just updated and verified the `backend/DB/` foundation package on the `feature/db-foundation` branch.

Please review the following updates made in `backend/DB/`, evaluate the synergy with our `backend/crud/` routes, cross-question any assumptions, and implement the best-fit solution in our routes.

---

### 1. What the Database Layer (`backend/DB/`) Now Provides

The `backend/DB/` package now exposes clean async repository methods in `DB.crud`, eliminating the need to write raw `db[COLLECTION_*]` queries in our route files:

#### A. User & Authentication Repositories (`DB.crud`)
- `create_user(db, user_data: Dict[str, Any]) -> Dict[str, Any]`
  - Enforces lowercase normalized unique email constraint.
  - Automatically generates `user_id` (`usr_...`) and ISO UTC timestamps.
- `get_user_by_email(db, email: str) -> Optional[Dict[str, Any]]`
  - Case-insensitive email lookup.
- `get_user_by_id(db, user_id: str) -> Optional[Dict[str, Any]]`
  - Looks up user by `user_id` or `_id`.
- `update_user(db, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]`
  - Safely updates fields while stripping immutable keys (`user_id`, `created_at`, `_id`).
- `delete_user(db, user_id: str, soft_delete: bool = True) -> bool`
  - Soft-deactivates (`is_active: False`) or deletes user record.

#### B. Schemes & Rules Repositories (`DB.crud`)
- `get_all_schemes(db, category: Optional[str] = None, state: Optional[str] = None, is_active: bool = True) -> List[Dict[str, Any]]`
  - **New:** Now supports `state` filtering (checks if `applicable_states` contains the state or `"ALL"`).
- `get_scheme_by_id(db, scheme_id: str) -> Optional[Dict[str, Any]]`
  - Supports slug and case normalization (`PM-KISAN` vs `pm_kisan`).
- `delete_scheme(db, scheme_id: str, soft_delete: bool = True) -> bool`
  - Deactivates (`is_active: False`) or removes scheme.
- `add_scheme_rule_condition(db, scheme_id: str, rule_condition: Dict[str, Any]) -> Optional[Dict[str, Any]]`
  - Safely appends an eligibility condition into the scheme's `rules` list.
- `create_or_update_scheme_rules(db, scheme_id: str, rules_data: Dict[str, Any]) -> Dict[str, Any]`
- `delete_scheme_rules(db, scheme_id: str) -> bool`

#### C. Grievances & Officer Workflow (`DB.crud`)
- `assign_grievance_officer(db, ticket_id: str, officer_id: str, comment: Optional[str] = None) -> Optional[Dict[str, Any]]`
  - Automatically sets status to `ASSIGNED`, updates `assigned_officer`, and appends an official audit entry to the ticket's `timeline`.
- `update_grievance_status(db, ticket_id: str, new_status: Any, comment: str, updated_by: str) -> Optional[Dict[str, Any]]`
  - Automatically handles stringification of Enums (`GrievanceStatus.RESOLVED` -> `"RESOLVED"`).

#### D. Citizen Profile Repositories (`DB.crud`)
- `upsert_citizen_profile(db, user_id: str, profile_data: Dict[str, Any], preserve_existing: bool = True) -> Dict[str, Any]`
  - Non-destructive updates: preserves previously extracted fields when partial updates are submitted.
- `get_citizen_profile(db, user_id: str) -> Optional[Dict[str, Any]]`
- `delete_citizen_profile(db, user_id: str) -> bool`

#### E. Schema Flexibility (`DB.schemas`)
- `CitizenProfileBase`: Supports both `annual_income` and `income` alias interchangeably, plus `documents: List[str]` and `consent: bool`.
- `GrievanceCreate`: Supports both `complaint` and `complaint_text` alias, optional `intent` (defaults to `"GENERAL_GRIEVANCE"`), and `voice_text`.
- `SchemeBase`: Supports aliases `code` (`scheme_code`), `type` (`scheme_type`), and `official_source` (`official_url`).
- Default database name aligned to `MONGO_DB_NAME = "sahayak"`.

---

### 2. Proposed Changes for Our Backend Routes (`backend/crud/routes/`)

Please review and implement the following refactors:

1. **`routes/auth.py`**:
   - In `register()`: Replace raw `db[COLLECTION_USERS].find_one` and `insert_one` with:
     ```python
     import DB.crud as db_crud
     existing = await db_crud.get_user_by_email(db, payload.email)
     if existing:
         raise HTTPException(status_code=409, detail="Email is already registered")
     user_record = await db_crud.create_user(db, user_data)
     ```
   - In `login()`: Replace raw `find_one` with `await db_crud.get_user_by_email(db, credentials.email)`.

2. **`routes/users.py`**:
   - In `get_my_user()`: Use `await db_crud.get_user_by_id(db, user_id)`.
   - In `update_my_user()`: Use `await db_crud.update_user(db, user_id, update_payload)`.
   - In `delete_my_user()`: Use `await db_crud.delete_user(db, user_id, soft_delete=True)`.

3. **`routes/schemes.py`**:
   - In `list_schemes()`: Pass `state` filter to DB:
     ```python
     schemes = await db_crud.get_all_schemes(db, category=category, state=state, is_active=is_active)
     ```
   - In `delete_scheme()`: Use `await db_crud.delete_scheme(db, scheme_id, soft_delete=True)`.

4. **`routes/rules.py`**:
   - In `create_rule()`: Use `await db_crud.add_scheme_rule_condition(db, scheme_id, rule_condition)`.

5. **`routes/grievances.py`**:
   - In `assign_grievance()`: Use `await db_crud.assign_grievance_officer(db, ticket_id=grievance_id, officer_id=assign_in.assigned_officer)`.

6. **`routes/profiles.py`**:
   - In `delete_my_profile()`: Use `await db_crud.delete_citizen_profile(db, user_id)`.

---

### 3. Your Task as Backend Agent
1. **Cross-Question & Verify**: Check if any of these changes conflict with your current JWT auth dependencies or response serialization.
2. **Implement Best-Fit Solution**: Cleanly replace raw collection queries with the `DB.crud` helpers while maintaining our existing error handling and fallback behavior.
3. **Verify**: Ensure the FastAPI application boots up and tests pass without errors.
```
