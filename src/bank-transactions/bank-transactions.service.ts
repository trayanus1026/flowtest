import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { bankTransactions, idempotencyKeys } from '../database/schema';
import { eq } from 'drizzle-orm';
import { BulkImportDto } from './dto/bulk-import.dto';
import { createHash } from 'crypto';

@Injectable()
export class BankTransactionsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  private hashPayload(payload: any): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async bulkImport(tenantId: string, bulkImportDto: BulkImportDto) {
    const idempotencyKey = bulkImportDto.idempotencyKey;
    const payloadHash = this.hashPayload(bulkImportDto.transactions);

    // Check idempotency if key is provided
    if (idempotencyKey) {
      const [existing] = await this.db
        .select()
        .from(idempotencyKeys)
        .where(eq(idempotencyKeys.key, idempotencyKey));

      if (existing) {
        // Same key exists - check if payload matches
        if (existing.payloadHash === payloadHash) {
          // Same payload - return cached result
          return JSON.parse(existing.result);
        } else {
          // Different payload - conflict
          throw new ConflictException(
            'Idempotency key already used with different payload',
          );
        }
      }
    }

    // Insert transactions in a transaction
    const result = await this.db.transaction(async (tx: any) => {
      const inserted = await tx
        .insert(bankTransactions)
        .values(
          bulkImportDto.transactions.map((t) => ({
            tenantId,
            externalId: t.externalId,
            postedAt: new Date(t.postedAt),
            amount: t.amount.toString(),
            currency: t.currency || 'USD',
            description: t.description,
          })),
        )
        .returning();

      // Store idempotency key if provided
      if (idempotencyKey) {
        await tx.insert(idempotencyKeys).values({
          key: idempotencyKey,
          tenantId,
          payloadHash,
          result: JSON.stringify({ transactions: inserted }),
        });
      }

      return { transactions: inserted };
    });

    return result;
  }

  async findAll(tenantId: string) {
    return this.db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.tenantId, tenantId));
  }
}

