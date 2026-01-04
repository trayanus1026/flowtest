import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { MatchCandidate } from './reconciliation.service';

@Injectable()
export class PythonReconciliationClient {
  private client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('PYTHON_API_URL') ||
      'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  async scoreCandidates(
    tenantId: string,
    invoices: any[],
    transactions: any[],
  ): Promise<MatchCandidate[]> {
    try {
      const response = await this.client.post('/reconcile/score', {
        tenantId,
        invoices: invoices.map((inv) => ({
          id: inv.id,
          amount: parseFloat(inv.amount),
          currency: inv.currency,
          invoiceDate: inv.invoiceDate,
          description: inv.description,
          vendorId: inv.vendorId,
        })),
        transactions: transactions.map((t) => ({
          id: t.id,
          amount: parseFloat(t.amount),
          currency: t.currency,
          postedAt: t.postedAt,
          description: t.description,
        })),
      });

      return response.data.candidates || [];
    } catch (error) {
      console.error('Python reconciliation service error:', error);
      // Fallback to local deterministic matching if Python service unavailable
      return this.localScoreCandidates(invoices, transactions);
    }
  }

  private localScoreCandidates(
    invoices: any[],
    transactions: any[],
  ): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    for (const invoice of invoices) {
      const invAmount = parseFloat(invoice.amount);
      const invDate = invoice.invoiceDate
        ? new Date(invoice.invoiceDate)
        : null;

      for (const transaction of transactions) {
        const txAmount = parseFloat(transaction.amount);
        const txDate = transaction.postedAt
          ? new Date(transaction.postedAt)
          : null;

        let score = 0;

        // Exact amount match (strong)
        if (Math.abs(invAmount - txAmount) < 0.01) {
          score += 50;
        } else if (Math.abs(invAmount - txAmount) / invAmount < 0.05) {
          // Within 5% tolerance
          score += 30;
        }

        // Date proximity (±3 days)
        if (invDate && txDate) {
          const daysDiff = Math.abs(
            (invDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysDiff <= 3) {
            score += 20;
          } else if (daysDiff <= 7) {
            score += 10;
          }
        }

        // Text similarity (simple keyword matching)
        if (invoice.description && transaction.description) {
          const invWords = invoice.description.toLowerCase().split(/\s+/);
          const txWords = transaction.description.toLowerCase().split(/\s+/);
          const commonWords = invWords.filter((w) => txWords.includes(w));
          if (commonWords.length > 0) {
            score += Math.min(commonWords.length * 5, 30);
          }
        }

        if (score >= 50) {
          candidates.push({
            invoiceId: invoice.id,
            bankTransactionId: transaction.id,
            score,
          });
        }
      }
    }

    // Sort by score descending and return top candidates
    return candidates.sort((a, b) => b.score - a.score).slice(0, 20);
  }
}

