import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantInput } from './dto/create-tenant.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Resolver(() => Tenant)
@UseGuards(AuthGuard, RolesGuard)
export class TenantsResolver {
  constructor(private readonly tenantsService: TenantsService) {}

  @Query(() => [Tenant], { name: 'tenants' })
  @Roles('admin', 'super_admin')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Query(() => Tenant, { name: 'tenant' })
  findOne(@Args('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Mutation(() => Tenant)
  @Roles('admin', 'super_admin')
  createTenant(@Args('input') input: CreateTenantInput) {
    return this.tenantsService.create(input.name);
  }
}

