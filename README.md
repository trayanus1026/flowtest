# Multi-Tenant Invoice Reconciliation API

A senior-level implementation of a multi-tenant invoice reconciliation system built with NestJS (TypeScript) and Python, featuring REST and GraphQL APIs, PostgreSQL with Row Level Security, and AI-powered explanations.

## Architecture Overview

### System Components

1. **NestJS Backend (Primary)**
   - REST API endpoints
   - GraphQL API (Apollo Server)
   - Authentication & Authorization (JWT)
   - Multi-tenant data isolation
   - PostgreSQL with Drizzle ORM
   - Row Level Security (RLS) enforcement

2. **Python Backend (Reconciliation Engine)**
   - Strawberry GraphQL API
   - Deterministic scoring algorithm
   - SQLAlchemy 2.0 + Alembic
   - REST API for scoring endpoints

3. **Database**
   - PostgreSQL with RLS policies
   - Drizzle ORM for TypeScript
   - SQLAlchemy for Python (minimal usage)

## Key Architectural Decisions

### 1. Multi-Tenancy Strategy

**Defense-in-Depth Approach:**
- **Application Layer**: All queries filtered by `tenant_id`
- **Database Layer**: Row Level Security (RLS) policies enforce tenant isolation
- **Interceptor**: `RlsContextInterceptor` sets PostgreSQL session variables on every request

**RLS Implementation:**
- Context variables set via `app.set_context()` function:
  - `app.current_user_id`
  - `app.current_org_id` (tenant ID)
  - `app.is_super_admin`
- Policies check `tenant_id` against `app.current_org_id`
- Super admin bypasses RLS for system operations

**Rationale**: This provides defense-in-depth. Even if application code has bugs, RLS prevents data leakage at the database level.

### 2. Transaction Boundaries

**Idempotency Implementation:**
- Idempotency keys stored in `idempotency_keys` table
- Payload hash comparison ensures same key + same payload = same result
- Different payload with same key returns 409 Conflict
- Atomic transaction ensures consistency

**Reconciliation Process:**
- Match confirmation uses database transactions
- Invoice status updated atomically with match confirmation
- Prevents race conditions and partial updates

### 3. Reconciliation Scoring Algorithm

**Deterministic Heuristics (Non-AI):**
1. **Exact Amount Match**: +50 points
2. **Amount within 5% tolerance**: +30 points
3. **Date proximity (±3 days)**: +20 points
4. **Date proximity (±7 days)**: +10 points
5. **Text similarity**: Up to +30 points (based on common keywords)

**Scoring Formula:**
```
score = amount_match_score + date_proximity_score + text_similarity_score
score = min(score, 100.0)  // Capped at 100
```

**Threshold**: Only candidates with `score >= 50` are returned as proposed matches.

### 4. AI Integration (Pragmatic)

**Design Principles:**
- AI is **not** the primary matching engine (deterministic scoring is)
- AI provides **explanations** only
- Graceful degradation: Falls back to deterministic explanations if AI unavailable

**Implementation:**
- OpenAI integration (configurable via `OPENAI_API_KEY`)
- Timeout handling and error recovery
- Deterministic fallback always available
- Mockable for testing

### 5. Service Boundaries

**NestJS Responsibilities:**
- Authentication & Authorization
- Multi-tenant data access
- Idempotency handling
- Persistence (Drizzle ORM)
- API layer (REST + GraphQL)

**Python Responsibilities:**
- Deterministic scoring algorithm
- Match candidate generation
- Deterministic explanations
- **NOT** responsible for: auth, persistence, idempotency

**Communication:**
- HTTP REST API between NestJS and Python
- Fallback to local scoring if Python service unavailable

## Data Model

### Core Tables

- **tenants**: Organization/tenant information
- **vendors**: Optional vendor information (tenant-scoped)
- **invoices**: Invoice records (tenant-scoped, status: open/matched/paid)
- **bank_transactions**: Bank transaction records (tenant-scoped)
- **matches**: Match candidates and confirmed matches (status: proposed/confirmed/rejected)
- **idempotency_keys**: Idempotency tracking for bank transaction imports

### Relationships

- All tenant-scoped tables reference `tenants.id`
- `matches` links `invoices` and `bank_transactions`
- RLS policies enforce tenant isolation on all tenant-scoped tables

## API Endpoints

### REST API

#### Tenants
- `POST /tenants` - Create tenant (admin only)
- `GET /tenants` - List tenants (admin only)
- `GET /tenants/:id` - Get tenant

#### Invoices
- `POST /tenants/:tenant_id/invoices` - Create invoice
- `GET /tenants/:tenant_id/invoices` - List invoices (supports filters: status, vendor, date range, amount range)
- `DELETE /tenants/:tenant_id/invoices/:id` - Delete invoice

#### Bank Transactions
- `POST /tenants/:tenant_id/bank-transactions/import` - Bulk import (idempotent)
- `GET /tenants/:tenant_id/bank-transactions` - List transactions

#### Reconciliation
- `POST /tenants/:tenant_id/reconcile` - Run reconciliation, return match candidates
- `GET /tenants/:tenant_id/reconcile/explain?invoice_id=...&transaction_id=...` - Get AI explanation

#### Matches
- `POST /tenants/:tenant_id/matches/:match_id/confirm` - Confirm a proposed match

### GraphQL API

**Queries:**
- `tenants` - List tenants
- `invoices(tenantId, filters, pagination)` - List invoices with filters
- `bankTransactions(tenantId)` - List bank transactions
- `matchCandidates(tenantId)` - Get match candidates
- `explainReconciliation(tenantId, invoiceId, transactionId)` - Get explanation

**Mutations:**
- `createTenant(input)` - Create tenant
- `createInvoice(tenantId, input)` - Create invoice
- `deleteInvoice(tenantId, invoiceId)` - Delete invoice
- `importBankTransactions(tenantId, input, idempotencyKey)` - Import transactions
- `reconcile(tenantId)` - Run reconciliation
- `confirmMatch(tenantId, matchId)` - Confirm match

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.13
- PostgreSQL 14+
- OpenAI API key (optional, for AI explanations)

### Environment Variables

Create `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=invoice_reconciliation
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoice_reconciliation

# JWT
JWT_SECRET=your-secret-key-change-in-production

# OpenAI (optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Python API
PYTHON_API_URL=http://localhost:8000

# Server
PORT=3000
```

### Database Setup

1. **Create PostgreSQL database:**
```bash
createdb invoice_reconciliation
```

2. **Run Drizzle migrations:**
```bash
npm install
npm run db:generate
npm run db:migrate
```

3. **Set up RLS policies:**
```bash
psql invoice_reconciliation < src/database/rls-setup.sql
```

### NestJS Backend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test
npm run test:e2e
```

The API will be available at:
- REST: `http://localhost:3000`
- GraphQL: `http://localhost:3000/graphql`

### Python Backend Setup

```bash
cd python

# Create virtual environment
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Start server
python -m app.main
# Or: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The Python API will be available at:
- REST: `http://localhost:8000/reconcile`
- GraphQL: `http://localhost:8000/graphql`
- Health: `http://localhost:8000/health`

## Testing

### Node.js Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

**Test Coverage:**
- Service layer unit tests
- Controller integration tests
- Idempotency behavior
- RLS cross-tenant access blocking
- AI explanation fallback

### Python Tests

```bash
cd python
pytest

# With coverage
pytest --cov=app tests/
```

**Test Coverage:**
- Deterministic scoring algorithm
- Deterministic explanation generation
- Reconciliation service ranking
- Strawberry GraphQL resolvers

## Authentication

The API uses JWT authentication. Include the token in requests:

```bash
Authorization: Bearer <token>
```

**JWT Payload Structure:**
```json
{
  "sub": "user-id",
  "tenantId": "tenant-id",
  "email": "user@example.com",
  "roles": ["user", "admin"],
  "isSuperAdmin": false
}
```

## Key Features Demonstrated

### 1. Multi-Tenant Isolation
- ✅ Application-level filtering
- ✅ Database-level RLS policies
- ✅ Interceptor-based context setting
- ✅ Test proving cross-tenant access blocked

### 2. Idempotency
- ✅ Idempotency key support
- ✅ Payload hash comparison
- ✅ Conflict detection for different payloads
- ✅ Atomic transaction handling

### 3. Transaction Boundaries
- ✅ Match confirmation updates invoice status atomically
- ✅ Bank transaction import uses transactions
- ✅ Idempotency key storage in same transaction

### 4. AI Integration
- ✅ Configurable OpenAI integration
- ✅ Graceful fallback to deterministic explanations
- ✅ Timeout and error handling
- ✅ Mockable for testing

### 5. Clean Architecture
- ✅ Separation of concerns (NestJS vs Python)
- ✅ Service layer shared by REST and GraphQL
- ✅ Dependency injection
- ✅ Type safety throughout

### 6. Testing
- ✅ Unit tests for services
- ✅ E2E tests for API endpoints
- ✅ Python tests for scoring logic
- ✅ RLS isolation tests

## Scoring Logic Details

The reconciliation engine uses deterministic heuristics:

1. **Amount Matching** (0-50 points)
   - Exact match (within $0.01): 50 points
   - Within 5% tolerance: 30 points
   - Otherwise: 0 points

2. **Date Proximity** (0-20 points)
   - Within 3 days: 20 points
   - Within 7 days: 10 points
   - Otherwise: 0 points

3. **Text Similarity** (0-30 points)
   - Common keywords ratio × 30
   - Stop words filtered out
   - Capped at 30 points

**Minimum Threshold**: 50 points required for a match candidate.

**Ranking**: Candidates sorted by score descending, top N returned.

## Production Considerations

1. **Security**
   - Change `JWT_SECRET` to a strong random value
   - Use environment-specific configuration
   - Enable HTTPS
   - Rate limiting on API endpoints

2. **Performance**
   - Add database indexes (already included in schema)
   - Consider caching for reconciliation results
   - Connection pooling (configured in Drizzle)

3. **Monitoring**
   - Add logging (Winston/Pino)
   - Health check endpoints
   - Metrics collection

4. **Scalability**
   - Horizontal scaling for NestJS (stateless)
   - Python service can be scaled independently
   - Database connection pooling

## License

UNLICENSED - Internal use only

