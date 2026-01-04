import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesResolver } from './invoices.resolver';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesResolver],
  exports: [InvoicesService],
})
export class InvoicesModule {}

