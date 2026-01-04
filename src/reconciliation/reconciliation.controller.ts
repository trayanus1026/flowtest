import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Controller('tenants/:tenant_id/reconcile')
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post()
  reconcile(@TenantId() tenantId: string) {
    return this.reconciliationService.reconcile(tenantId);
  }

  @Get('explain')
  explain(
    @TenantId() tenantId: string,
    @Query('invoice_id') invoiceId: string,
    @Query('transaction_id') transactionId: string,
  ) {
    return this.reconciliationService.explainMatch(
      tenantId,
      invoiceId,
      transactionId,
    );
  }
}

