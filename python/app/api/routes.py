from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.reconciliation import ReconciliationService
from app.models.invoice import InvoiceInput
from app.models.transaction import TransactionInput

router = APIRouter()


class InvoiceRequest(BaseModel):
    id: str
    amount: float
    currency: str
    invoice_date: Optional[str] = None
    description: Optional[str] = None
    vendor_id: Optional[str] = None


class TransactionRequest(BaseModel):
    id: str
    amount: float
    currency: str
    posted_at: str
    description: Optional[str] = None


class ScoreRequest(BaseModel):
    tenant_id: str
    invoices: List[InvoiceRequest]
    transactions: List[TransactionRequest]
    top_n: Optional[int] = 20


class MatchCandidateResponse(BaseModel):
    invoice_id: str
    bank_transaction_id: str
    score: float
    explanation: Optional[str] = None


class ScoreResponse(BaseModel):
    candidates: List[MatchCandidateResponse]


@router.post("/score", response_model=ScoreResponse)
async def score_candidates(request: ScoreRequest):
    """
    Score match candidates between invoices and transactions.
    Returns ranked list of candidates.
    """
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
        for inv in request.invoices
    ]

    transaction_models = [
        TransactionInput(
            id=t.id,
            amount=t.amount,
            currency=t.currency,
            posted_at=t.posted_at,
            description=t.description,
        )
        for t in request.transactions
    ]

    candidates = service.score_candidates(
        request.tenant_id, invoice_models, transaction_models, request.top_n
    )

    return ScoreResponse(
        candidates=[
            MatchCandidateResponse(
                invoice_id=c.invoice_id,
                bank_transaction_id=c.bank_transaction_id,
                score=c.score,
                explanation=c.explanation,
            )
            for c in candidates
        ]
    )

