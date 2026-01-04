import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Controller('tenants/:tenant_id/invoices')
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(tenantId, createInvoiceDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string, @Query() filters: FilterInvoiceDto) {
    return this.invoicesService.findAll(tenantId, filters);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.delete(tenantId, id);
  }
}

