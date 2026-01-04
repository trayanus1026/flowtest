import { Module } from '@nestjs/common';
import { BankTransactionsService } from './bank-transactions.service';
import { BankTransactionsController } from './bank-transactions.controller';
import { BankTransactionsResolver } from './bank-transactions.resolver';

@Module({
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService, BankTransactionsResolver],
  exports: [BankTransactionsService],
})
export class BankTransactionsModule {}

