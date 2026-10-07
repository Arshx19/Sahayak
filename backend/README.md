# Backend - SAHAYAK

FastAPI backend service powering the SAHAYAK platform.

## Scope of Development
- **API Endpoints**: RESTful APIs for authentication, citizen profiles, scheme queries, grievance workflows, and administrative actions.
- **Authentication & Authorization**: JWT token issuance, password hashing, and Role-Based Access Control (RBAC: Citizen, Officer, Admin).
- **Service Layer**: Business orchestration coordinating database persistence, rules evaluation, and external AI services.
- **Data Validation & Schemas**: Pydantic models for request validation and response serialization.
- **Middleware**: Authentication verification, audit logging, CORS, and unified error handling.
