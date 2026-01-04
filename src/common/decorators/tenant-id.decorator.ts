import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Try to get from path parameter first
    const tenantId = request.params?.tenant_id || request.params?.tenantId;
    if (tenantId) {
      return tenantId;
    }
    
    // Fall back to user's tenant
    if (user?.tenantId) {
      return user.tenantId;
    }
    
    throw new Error('Tenant ID not found in request');
  },
);

