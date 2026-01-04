import strawberry
from typing import List, Optional
from app.services.reconciliation import ReconciliationService
from app.models.match_candidate import MatchCandidate
from app.models.invoice import InvoiceInput
from app.models.transaction import TransactionInput


@strawberry.type
class MatchCandidateType:
    invoice_id: str
    bank_transaction_id: str
    score: float
    explanation: Optional[str] = None


@strawberry.input
class InvoiceInputType:
    id: str
    amount: float
    currency: str
    invoice_date: Optional[str] = None
    description: Optional[str] = None
    vendor_id: Optional[str] = None


@strawberry.input
class TransactionInputType:
    id: str
    amount: float
    currency: str
    posted_at: str
    description: Optional[str] = None


@strawberry.type
class Query:
    @strawberry.field
    async def score_candidates(
        tenant_id: str,
        invoices: List[InvoiceInputType],
        transactions: List[TransactionInputType],
        top_n: int = 20,
    ) -> List[MatchCandidateType]:
        service = ReconciliationService()
        
        invoice_models = [
            InvoiceInput(
                id=inv.id,
                amount=inv.amount,
                currency=inv.currency,
                invoice_date=inv.invoice_date,
                description=inv.description,
                vendor_id=inv.vendor_id,
            )
            for inv in invoices
        ]
        
        transaction_models = [
            TransactionInput(
                id=t.id,
                amount=t.amount,
                currency=t.currency,
                posted_at=t.posted_at,
                description=t.description,
            )
            for t in transactions
        ]
        
        candidates = service.score_candidates(
            tenant_id, invoice_models, transaction_models, top_n
        )
        
        return [
            MatchCandidateType(
                invoice_id=c.invoice_id,
                bank_transaction_id=c.bank_transaction_id,
                score=c.score,
                explanation=c.explanation,
            )
            for c in candidates
        ]


schema = strawberry.Schema(query=Query)

