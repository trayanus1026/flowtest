# Multi-Tenant Invoice Reconciliation API

implementation of a multi-tenant invoice reconciliation system built with NestJS (TypeScript) and Python, featuring REST and GraphQL APIs, PostgreSQL with Row Level Security, and AI-powered explanations.

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

### 1. Reconciliation Scoring Algorithm

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

### 2. AI Integration (Pragmatic)

**Design Principles:**
- AI is **not** the primary matching engine (deterministic scoring is)
- AI provides **explanations** only
- Graceful degradation: Falls back to deterministic explanations if AI unavailable

**Implementation:**
- OpenAI integration (configurable via `OPENAI_API_KEY`)
- Timeout handling and error recovery
- Deterministic fallback always available
- Mockable for testing

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

- Node.js 24.12.0 and npm
- Python 3.12.10
- PostgreSQL 18

### Database Setup (Local PostgreSQL)

1. **Install and start PostgreSQL:**
   - Install PostgreSQL 18 on your system
   - Start the PostgreSQL service
   - On Windows: PostgreSQL service should start automatically
   - On Linux/Mac: `sudo systemctl start postgresql` or `brew services start postgresql`

2. **Create the database:**
   Open Command prompt window.
   
   ```bash
   psql -U postgres
   CREATE DATABASE flowtest;
   \q
   ```

3. Config env file
     DB_HOST=localhost
     DB_PORT=5432
     DB_USER=postgres
     DB_PASSWORD=postgres
     DB_NAME=flowtest
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowtest

   - Update `DB_PASSWORD` if your PostgreSQL password is different

4. **Run Drizzle migrations:**
```bash
npm install
npm run db:generate
npm run db:migrate
```

5. **Set up RLS policies:**
   ```bash
   # Using psql
   psql -U postgres -d flowtest -f src/database/rls-setup.sql
   
   ```

   **Note:** The `ALTER DATABASE` command in the RLS setup may require superuser privileges. If you get a permission error, you can safely skip that line as it's optional.

### NestJS Backend Setup
   open three cmd window.
   1. for nestjs server
   2. for python server
   3. for test

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
py -m venv venv
cd venv/scripts
activate

# Install dependencies
pip install -r requirements.txt

# Run tests
set PYTHONPATH=.
pytest

# Start server
python -m app.main
```

The Python API will be available at:
- REST: `http://localhost:8000/reconcile`
- GraphQL: `http://localhost:8000/graphql`
- Health: `http://localhost:8000/health`

## Testing

### Node.js Tests

```bash
# Unit tests
npm run test

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

