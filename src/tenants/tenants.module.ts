import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantsResolver } from './tenants.resolver';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantsResolver],
  exports: [TenantsService],
})
export class TenantsModule {}

