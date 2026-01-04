import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ReconciliationService } from './reconciliation.service';
import { MatchCandidate } from './entities/match-candidate.entity';
import { ExplainReconciliationResponse } from './entities/explain-reconciliation.entity';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RlsContextInterceptor } from '../common/interceptors/rls-context.interceptor';

@Resolver()
@UseGuards(AuthGuard)
@UseInterceptors(RlsContextInterceptor)
export class ReconciliationResolver {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Query(() => [MatchCandidate], { name: 'matchCandidates' })
  matchCandidates(@Args('tenantId') tenantId: string) {
    return this.reconciliationService.reconcile(tenantId);
  }

  @Query(() => ExplainReconciliationResponse, { name: 'explainReconciliation' })
  explainReconciliation(
    @Args('tenantId') tenantId: string,
    @Args('invoiceId') invoiceId: string,
    @Args('transactionId') transactionId: string,
  ) {
    return this.reconciliationService.explainMatch(
      tenantId,
      invoiceId,
      transactionId,
    );
  }

  @Mutation(() => Boolean)
  async reconcile(@Args('tenantId') tenantId: string) {
    await this.reconciliationService.reconcile(tenantId);
    return true;
  }

  @Mutation(() => Boolean)
  async confirmMatch(@Args('tenantId') tenantId: string, @Args('matchId') matchId: string) {
    await this.reconciliationService.confirmMatch(tenantId, matchId);
    return true;
  }
}

