import pytest
from datetime import datetime, timedelta
from app.services.scoring import ScoringService
from app.models.invoice import InvoiceInput
from app.models.transaction import TransactionInput


class TestScoringService:
    def setup_method(self):
        self.service = ScoringService()

    def test_exact_amount_match(self):
        """Test that exact amount matches get high score."""
        invoice = InvoiceInput(
            id="inv1",
            amount=100.0,
            currency="USD",
            invoice_date=datetime.now().isoformat(),
        )
        transaction = TransactionInput(
            id="tx1",
            amount=100.0,
            currency="USD",
            posted_at=datetime.now().isoformat(),
        )

        score = self.service.calculate_score(invoice, transaction)
        assert score >= 50.0, "Exact amount match should score at least 50"

    def test_amount_within_tolerance(self):
        """Test that amounts within 5% tolerance get partial score."""
        invoice = InvoiceInput(
            id="inv1", amount=100.0, currency="USD", invoice_date=None
        )
        transaction = TransactionInput(
            id="tx1", amount=103.0, currency="USD", posted_at=datetime.now().isoformat()
        )

        score = self.service.calculate_score(invoice, transaction)
        assert 30.0 <= score < 50.0, "Amount within tolerance should score 30-50"

    def test_date_proximity(self):
        """Test that dates within 3 days add to score."""
        base_date = datetime.now()
        invoice = InvoiceInput(
            id="inv1",
            amount=100.0,
            currency="USD",
            invoice_date=base_date.isoformat(),
        )
        transaction = TransactionInput(
            id="tx1",
            amount=100.0,
            currency="USD",
            posted_at=(base_date + timedelta(days=2)).isoformat(),
        )

        score = self.service.calculate_score(invoice, transaction)
        assert score >= 70.0, "Exact amount + date proximity should score >= 70"

    def test_text_similarity(self):
        """Test that common words in descriptions add to score."""
        invoice = InvoiceInput(
            id="inv1",
            amount=100.0,
            currency="USD",
            description="Payment for office supplies",
        )
        transaction = TransactionInput(
            id="tx1",
            amount=100.0,
            currency="USD",
            posted_at=datetime.now().isoformat(),
            description="Office supplies payment",
        )

        score = self.service.calculate_score(invoice, transaction)
        assert score >= 50.0, "Text similarity should contribute to score"

    def test_deterministic_explanation(self):
        """Test that explanation generation is deterministic."""
        invoice = InvoiceInput(
            id="inv1",
            amount=100.0,
            currency="USD",
            invoice_date=datetime.now().isoformat(),
            description="Test invoice",
        )
        transaction = TransactionInput(
            id="tx1",
            amount=100.0,
            currency="USD",
            posted_at=datetime.now().isoformat(),
            description="Test transaction",
        )

        explanation1 = self.service.generate_explanation(invoice, transaction, 80.0)
        explanation2 = self.service.generate_explanation(invoice, transaction, 80.0)

        assert explanation1 == explanation2, "Explanations should be deterministic"
        assert "100.0" in explanation1, "Explanation should mention amount"
        assert "80.00" in explanation1, "Explanation should mention score"

