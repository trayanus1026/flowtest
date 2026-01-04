import pytest
from datetime import datetime
from app.services.reconciliation import ReconciliationService
from app.models.invoice import InvoiceInput
from app.models.transaction import TransactionInput


class TestReconciliationService:
    def setup_method(self):
        self.service = ReconciliationService()

    def test_score_candidates_returns_ranked_list(self):
        """Test that candidates are returned sorted by score descending."""
        invoices = [
            InvoiceInput(id="inv1", amount=100.0, currency="USD"),
            InvoiceInput(id="inv2", amount=200.0, currency="USD"),
        ]
        transactions = [
            TransactionInput(
                id="tx1", amount=100.0, currency="USD", posted_at=datetime.now().isoformat()
            ),
            TransactionInput(
                id="tx2", amount=200.0, currency="USD", posted_at=datetime.now().isoformat()
            ),
        ]

        candidates = self.service.score_candidates("tenant1", invoices, transactions)

        assert len(candidates) > 0, "Should return at least one candidate"

        scores = [c.score for c in candidates]
        assert scores == sorted(scores, reverse=True), "Candidates should be sorted by score"

    def test_score_candidates_filters_low_scores(self):
        """Test that only candidates with score >= 50 are returned."""
        invoices = [
            InvoiceInput(id="inv1", amount=100.0, currency="USD"),
        ]
        transactions = [
            TransactionInput(
                id="tx1", amount=1000.0, currency="USD", posted_at=datetime.now().isoformat()
            ),
        ]

        candidates = self.service.score_candidates("tenant1", invoices, transactions)

        for candidate in candidates:
            assert candidate.score >= 50.0, "All candidates should have score >= 50"

    def test_score_candidates_respects_top_n(self):
        """Test that top_n parameter limits results."""
        invoices = [InvoiceInput(id=f"inv{i}", amount=100.0, currency="USD") for i in range(10)]
        transactions = [
            TransactionInput(
                id=f"tx{i}", amount=100.0, currency="USD", posted_at=datetime.now().isoformat()
            )
            for i in range(10)
        ]

        candidates = self.service.score_candidates("tenant1", invoices, transactions, top_n=5)

        assert len(candidates) <= 5, "Should respect top_n parameter"

