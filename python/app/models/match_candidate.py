from dataclasses import dataclass
from typing import Optional


@dataclass
class MatchCandidate:
    invoice_id: str
    bank_transaction_id: str
    score: float
    explanation: Optional[str] = None

