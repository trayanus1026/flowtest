import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BankTransactionsService } from './bank-transactions.service';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BulkImportInput } from './dto/bulk-import.input';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Resolver(() => BankTransaction)
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class BankTransactionsResolver {
  constructor(private readonly bankTransactionsService: BankTransactionsService) {}

  @Query(() => [BankTransaction], { name: 'bankTransactions' })
  findAll(@Args('tenantId') tenantId: string) {
    return this.bankTransactionsService.findAll(tenantId);
  }

  @Mutation(() => [BankTransaction])
  importBankTransactions(
    @Args('tenantId') tenantId: string,
    @Args('input') input: BulkImportInput,
    @Args('idempotencyKey', { nullable: true }) idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      input.idempotencyKey = idempotencyKey;
    }
    return this.bankTransactionsService.bulkImport(tenantId, input);
  }
}

