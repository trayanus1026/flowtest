import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Inject } from '@nestjs/common';
import { POSTGRES_CLIENT } from '../../database/database.module';
import postgres from 'postgres';

@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  constructor(
    @Inject(POSTGRES_CLIENT)
    private readonly client: postgres.Sql,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user || { userId: null, tenantId: null, isSuperAdmin: false };

    // Set RLS context variables using raw SQL
    await this.client`
      SELECT app.set_context(
        ${user.userId || null}::UUID,
        ${user.tenantId || null}::UUID,
        ${user.isSuperAdmin || false}::BOOLEAN
      )
    `;

    return next.handle().pipe(
      tap(() => {
        // Context is automatically scoped to the transaction/connection
      }),
    );
  }
}

