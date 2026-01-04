import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiExplanationService {
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async explain(
    invoice: any,
    transaction: any,
    score: number | null,
  ): Promise<{ explanation: string; confidence?: string }> {
    // Try AI explanation first
    if (this.openai) {
      try {
        const explanation = await this.generateAiExplanation(
          invoice,
          transaction,
          score,
        );
        return {
          explanation,
          confidence: this.getConfidenceLabel(score),
        };
      } catch (error) {
        console.error('AI explanation failed, using fallback:', error);
        // Fall through to deterministic fallback
      }
    }

    // Deterministic fallback
    return {
      explanation: this.generateDeterministicExplanation(
        invoice,
        transaction,
        score,
      ),
      confidence: this.getConfidenceLabel(score),
    };
  }

  private async generateAiExplanation(
    invoice: any,
    transaction: any,
    score: number | null,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `Explain why this invoice and bank transaction are likely a match:

Invoice:
- Amount: ${invoice.amount} ${invoice.currency}
- Date: ${invoice.invoiceDate || 'N/A'}
- Description: ${invoice.description || 'N/A'}
- Invoice Number: ${invoice.invoiceNumber || 'N/A'}

Bank Transaction:
- Amount: ${transaction.amount} ${transaction.currency}
- Date: ${transaction.postedAt}
- Description: ${transaction.description || 'N/A'}

Match Score: ${score !== null ? score.toFixed(2) : 'N/A'}

Provide a concise explanation (2-6 sentences) of why these items likely match.`;

    const response = await this.openai.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial reconciliation assistant. Provide clear, concise explanations of why invoices and bank transactions match.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Unable to generate explanation';
  }

  private generateDeterministicExplanation(
    invoice: any,
    transaction: any,
    score: number | null,
  ): string {
    const invAmount = parseFloat(invoice.amount);
    const txAmount = parseFloat(transaction.amount);
    const amountMatch = Math.abs(invAmount - txAmount) < 0.01;

    const invDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
    const txDate = transaction.postedAt
      ? new Date(transaction.postedAt)
      : null;
    let dateMatch = false;
    let daysDiff = 0;
    if (invDate && txDate) {
      daysDiff = Math.abs(
        (invDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      dateMatch = daysDiff <= 3;
    }

    const parts: string[] = [];

    if (amountMatch) {
      parts.push(
        `The invoice amount (${invoice.amount} ${invoice.currency}) exactly matches the transaction amount.`,
      );
    } else if (Math.abs(invAmount - txAmount) / invAmount < 0.05) {
      parts.push(
        `The invoice amount (${invoice.amount} ${invoice.currency}) is within 5% of the transaction amount (${transaction.amount} ${transaction.currency}).`,
      );
    }

    if (dateMatch) {
      parts.push(
        `The invoice date and transaction date are within ${Math.round(daysDiff)} days of each other.`,
      );
    }

    if (invoice.description && transaction.description) {
      const invWords = invoice.description.toLowerCase().split(/\s+/);
      const txWords = transaction.description.toLowerCase().split(/\s+/);
      const commonWords = invWords.filter((w) => txWords.includes(w));
      if (commonWords.length > 0) {
        parts.push(
          `The descriptions share ${commonWords.length} common keyword(s), suggesting they refer to the same transaction.`,
        );
      }
    }

    if (score !== null) {
      parts.push(`Overall match score: ${score.toFixed(2)}/100.`);
    }

    if (parts.length === 0) {
      return 'Limited matching criteria found. Manual review recommended.';
    }

    return parts.join(' ');
  }

  private getConfidenceLabel(score: number | null): string {
    if (score === null) return 'unknown';
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
}

