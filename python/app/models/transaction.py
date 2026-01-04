from dataclasses import dataclass
from typing import Optional


@dataclass
class TransactionInput:
    id: str
    amount: float
    currency: str
    posted_at: str
    description: Optional[str] = None

