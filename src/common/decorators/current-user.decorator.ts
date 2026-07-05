import type { Cargo } from '@core/prisma/generated/client';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  cargo?: Cargo | null;
  escolaId?: string | null;
  matricula?: string | null;
  ativo?: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || request.session?.user || request.raw?.user;
  },
);
