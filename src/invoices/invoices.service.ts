import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { invoices } from '../database/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  async create(tenantId: string, createInvoiceDto: CreateInvoiceDto) {
    const [invoice] = await this.db
      .insert(invoices)
      .values({
        tenantId,
        vendorId: createInvoiceDto.vendorId,
        invoiceNumber: createInvoiceDto.invoiceNumber,
        amount: createInvoiceDto.amount.toString(),
        currency: createInvoiceDto.currency || 'USD',
        invoiceDate: createInvoiceDto.invoiceDate ? new Date(createInvoiceDto.invoiceDate) : null,
        description: createInvoiceDto.description,
        status: createInvoiceDto.status || 'open',
      })
      .returning();
    return invoice;
  }

  async findAll(tenantId: string, filters?: FilterInvoiceDto) {
    const conditions = [eq(invoices.tenantId, tenantId)];

    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status));
    }

    if (filters?.vendorId) {
      conditions.push(eq(invoices.vendorId, filters.vendorId));
    }

    if (filters?.startDate) {
      conditions.push(gte(invoices.invoiceDate, new Date(filters.startDate)));
    }

    if (filters?.endDate) {
      conditions.push(lte(invoices.invoiceDate, new Date(filters.endDate)));
    }

    if (filters?.minAmount !== undefined) {
      conditions.push(sql`${invoices.amount} >= ${filters.minAmount}`);
    }

    if (filters?.maxAmount !== undefined) {
      conditions.push(sql`${invoices.amount} <= ${filters.maxAmount}`);
    }

    return this.db.select().from(invoices).where(and(...conditions));
  }

  async findOne(tenantId: string, id: string) {
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)));

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async delete(tenantId: string, id: string) {
    const [invoice] = await this.db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
      .returning();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return { success: true };
  }
}

