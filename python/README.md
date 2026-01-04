# Python Reconciliation Engine

Deterministic reconciliation engine for matching invoices and bank transactions.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running

```bash
# Development server
python -m app.main

# Or with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Testing

```bash
pytest

# With coverage
pytest --cov=app tests/
```

## API Endpoints

### REST

- `POST /reconcile/score` - Score match candidates
- `GET /health` - Health check

### GraphQL

- `POST /graphql` - GraphQL endpoint
- Query: `scoreCandidates(tenantId, invoices, transactions, topN)`

## Architecture

- **Strawberry GraphQL**: GraphQL API framework
- **FastAPI**: REST API framework
- **SQLAlchemy 2.0**: ORM (minimal usage, migrations via Alembic)
- **Deterministic Scoring**: Non-AI matching algorithm

## Scoring Algorithm

See main README for detailed scoring logic.

