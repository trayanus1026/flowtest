import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { FilterInvoiceInput } from './dto/filter-invoice.input';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Resolver(() => Invoice)
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class InvoicesResolver {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Query(() => [Invoice], { name: 'invoices' })
  async findAll(
    @Args('tenantId') tenantId: string,
    @Args('filters', { nullable: true, type: () => FilterInvoiceInput }) filters?: FilterInvoiceInput,
  ) {
    return this.invoicesService.findAll(tenantId, filters);
  }

  @Query(() => Invoice, { name: 'invoice' })
  findOne(@Args('tenantId') tenantId: string, @Args('id') id: string) {
    return this.invoicesService.findOne(tenantId, id);
  }

  @Mutation(() => Invoice)
  createInvoice(
    @Args('tenantId') tenantId: string,
    @Args('input') input: CreateInvoiceInput,
  ) {
    return this.invoicesService.create(tenantId, input);
  }

  @Mutation(() => Boolean)
  async deleteInvoice(@Args('tenantId') tenantId: string, @Args('invoiceId') invoiceId: string) {
    await this.invoicesService.delete(tenantId, invoiceId);
    return true;
  }
}

