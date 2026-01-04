import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BankTransactionsService } from './bank-transactions.service';
import { BulkImportDto } from './dto/bulk-import.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Controller('tenants/:tenant_id/bank-transactions')
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class BankTransactionsController {
  constructor(private readonly bankTransactionsService: BankTransactionsService) {}

  @Post('import')
  async import(
    @TenantId() tenantId: string,
    @Body() bulkImportDto: BulkImportDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey && !bulkImportDto.idempotencyKey) {
      bulkImportDto.idempotencyKey = idempotencyKey;
    }

    return this.bankTransactionsService.bulkImport(tenantId, bulkImportDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.bankTransactionsService.findAll(tenantId);
  }
}

