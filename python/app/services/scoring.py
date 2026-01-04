from typing import Optional
from datetime import datetime
from app.models.invoice import InvoiceInput
from app.models.transaction import TransactionInput


class ScoringService:
    """
    Deterministic scoring service for matching invoices and transactions.
    Scoring rules:
    - Exact amount match: +50 points
    - Amount within 5% tolerance: +30 points
    - Date within 3 days: +20 points
    - Date within 7 days: +10 points
    - Text similarity: up to +30 points (based on common words)
    """

    AMOUNT_TOLERANCE = 0.05  # 5%
    DATE_TOLERANCE_STRICT = 3  # days
    DATE_TOLERANCE_LOOSE = 7  # days

    def calculate_score(
        self, invoice: InvoiceInput, transaction: TransactionInput
    ) -> float:
        """Calculate match score between invoice and transaction."""
        score = 0.0

        amount_diff = abs(invoice.amount - transaction.amount)
        if amount_diff < 0.01:
            score += 50.0
        elif amount_diff / invoice.amount <= self.AMOUNT_TOLERANCE:
            score += 30.0

        if invoice.invoice_date and transaction.posted_at:
            days_diff = self._calculate_days_diff(
                invoice.invoice_date, transaction.posted_at
            )
            if days_diff <= self.DATE_TOLERANCE_STRICT:
                score += 20.0
            elif days_diff <= self.DATE_TOLERANCE_LOOSE:
                score += 10.0

        if invoice.description and transaction.description:
            text_score = self._calculate_text_similarity(
                invoice.description, transaction.description
            )
            score += text_score

        return min(score, 100.0)

    def _calculate_days_diff(
        self, date1_str: str, date2_str: str
    ) -> float:
        """Calculate absolute difference in days between two date strings."""
        try:
            date1 = datetime.fromisoformat(date1_str.replace("Z", "+00:00"))
            date2 = datetime.fromisoformat(date2_str.replace("Z", "+00:00"))
            diff = abs((date1 - date2).total_seconds() / (24 * 60 * 60))
            return diff
        except (ValueError, AttributeError):
            return float("inf")

    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Simple text similarity based on common words.
        Returns score up to 30 points.
        """
        if not text1 or not text2:
            return 0.0

        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())

        stop_words = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
        }
        words1 = words1 - stop_words
        words2 = words2 - stop_words

        if not words1 or not words2:
            return 0.0

        common_words = words1.intersection(words2)
        if not common_words:
            return 0.0

        similarity_ratio = len(common_words) / max(len(words1), len(words2))
        return min(similarity_ratio * 30.0, 30.0)

    def generate_explanation(
        self,
        invoice: InvoiceInput,
        transaction: TransactionInput,
        score: float,
    ) -> str:
        """
        Generate deterministic explanation for the match.
        This is the fallback when AI is unavailable.
        """
        parts = []

        amount_diff = abs(invoice.amount - transaction.amount)
        if amount_diff < 0.01:
            parts.append(
                f"Exact amount match: {invoice.amount} {invoice.currency}"
            )
        elif amount_diff / invoice.amount <= self.AMOUNT_TOLERANCE:
            parts.append(
                f"Amount within 5% tolerance: invoice {invoice.amount} vs transaction {transaction.amount}"
            )

        # Date analysis
        if invoice.invoice_date and transaction.posted_at:
            days_diff = self._calculate_days_diff(
                invoice.invoice_date, transaction.posted_at
            )
            if days_diff <= self.DATE_TOLERANCE_STRICT:
                parts.append(
                    f"Dates within {int(days_diff)} days of each other"
                )
            elif days_diff <= self.DATE_TOLERANCE_LOOSE:
                parts.append(
                    f"Dates within {int(days_diff)} days (loose match)"
                )

        if invoice.description and transaction.description:
            words1 = set(invoice.description.lower().split())
            words2 = set(transaction.description.lower().split())
            common = words1.intersection(words2)
            if common:
                parts.append(
                    f"Shared {len(common)} keyword(s) in descriptions"
                )

        parts.append(f"Overall score: {score:.2f}/100")

        return ". ".join(parts) + "."

