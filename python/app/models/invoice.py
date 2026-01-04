from dataclasses import dataclass
from typing import Optional


@dataclass
class InvoiceInput:
    id: str
    amount: float
    currency: str
    invoice_date: Optional[str] = None
    description: Optional[str] = None
    vendor_id: Optional[str] = None

