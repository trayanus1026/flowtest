from typing import List
from datetime import datetime
from app.models.invoice import InvoiceInput
from app.models.transaction import TransactionInput
from app.models.match_candidate import MatchCandidate
from app.services.scoring import ScoringService


class ReconciliationService:
    def __init__(self):
        self.scoring_service = ScoringService()

    def score_candidates(
        self,
        tenant_id: str,
        invoices: List[InvoiceInput],
        transactions: List[TransactionInput],
        top_n: int = 20,
    ) -> List[MatchCandidate]:
        """
        Score match candidates between invoices and bank transactions.
        Returns top N candidates sorted by score descending.
        """
        candidates: List[MatchCandidate] = []

        for invoice in invoices:
            for transaction in transactions:
                # Skip if currencies don't match
                if invoice.currency != transaction.currency:
                    continue

                score = self.scoring_service.calculate_score(
                    invoice, transaction
                )

                # Only include candidates with score >= 50
                if score >= 50:
                    explanation = self.scoring_service.generate_explanation(
                        invoice, transaction, score
                    )
                    candidates.append(
                        MatchCandidate(
                            invoice_id=invoice.id,
                            bank_transaction_id=transaction.id,
                            score=score,
                            explanation=explanation,
                        )
                    )

        # Sort by score descending and return top N
        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:top_n]

