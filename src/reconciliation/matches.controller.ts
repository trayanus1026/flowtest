import { Controller, Post, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Controller('tenants/:tenant_id/matches')
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class MatchesController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post(':match_id/confirm')
  confirmMatch(@TenantId() tenantId: string, @Param('match_id') matchId: string) {
    return this.reconciliationService.confirmMatch(tenantId, matchId);
  }
}

