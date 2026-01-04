import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { matches, invoices, bankTransactions } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { PythonReconciliationClient } from './python-reconciliation.client';
import { AiExplanationService } from './ai-explanation.service';

export interface MatchCandidate {
  invoiceId: string;
  bankTransactionId: string;
  score: number;
  explanation?: string;
}

@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
    private readonly pythonClient: PythonReconciliationClient,
    private readonly aiExplanationService: AiExplanationService,
  ) {}

  async reconcile(tenantId: string): Promise<MatchCandidate[]> {
    // Fetch all open invoices and unmatched transactions
    const openInvoices = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.tenantId, tenantId), eq(invoices.status, 'open')));

    const allTransactions = await this.db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.tenantId, tenantId));

    // Get existing matches to exclude already matched transactions
    const existingMatches = await this.db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.tenantId, tenantId),
          eq(matches.status, 'confirmed'),
        ),
      );

    const matchedTransactionIds = new Set(
      existingMatches.map((m: any) => m.bankTransactionId),
    );

    const unmatchedTransactions = allTransactions.filter(
      (t: any) => !matchedTransactionIds.has(t.id),
    );

    // Call Python reconciliation engine
    const candidates = await this.pythonClient.scoreCandidates(
      tenantId,
      openInvoices,
      unmatchedTransactions,
    );

    // Store proposed matches
    if (candidates.length > 0) {
      await this.db.insert(matches).values(
        candidates.map((c) => ({
          tenantId,
          invoiceId: c.invoiceId,
          bankTransactionId: c.bankTransactionId,
          score: c.score.toString(),
          status: 'proposed',
        })),
      );
    }

    return candidates;
  }

  async confirmMatch(tenantId: string, matchId: string) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.tenantId, tenantId)));

    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }

    if (match.status !== 'proposed') {
      throw new Error(`Match ${matchId} is not in proposed status`);
    }

    // Update match status and invoice status in a transaction
    await this.db.transaction(async (tx: any) => {
      await tx
        .update(matches)
        .set({ status: 'confirmed' })
        .where(eq(matches.id, matchId));

      await tx
        .update(invoices)
        .set({ status: 'matched' })
        .where(eq(invoices.id, match.invoiceId));
    });

    return { success: true, matchId };
  }

  async explainMatch(
    tenantId: string,
    invoiceId: string,
    transactionId: string,
  ): Promise<{ explanation: string; confidence?: string }> {
    // Fetch invoice and transaction
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)));

    const [transaction] = await this.db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, transactionId),
          eq(bankTransactions.tenantId, tenantId),
        ),
      );

    if (!invoice || !transaction) {
      throw new Error('Invoice or transaction not found');
    }

    const [match] = await this.db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.invoiceId, invoiceId),
          eq(matches.bankTransactionId, transactionId),
          eq(matches.tenantId, tenantId),
        ),
      );

    const score = match ? parseFloat(match.score) : null;

    return this.aiExplanationService.explain(
      invoice,
      transaction,
      score,
    );
  }
}

