import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import { MatchesController } from './matches.controller';
import { ReconciliationResolver } from './reconciliation.resolver';
import { PythonReconciliationClient } from './python-reconciliation.client';
import { AiExplanationService } from './ai-explanation.service';

@Module({
  controllers: [ReconciliationController, MatchesController],
  providers: [
    ReconciliationService,
    PythonReconciliationClient,
    AiExplanationService,
    ReconciliationResolver,
  ],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}

