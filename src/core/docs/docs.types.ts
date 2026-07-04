import type { ServerVariableObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export type BuildApiServersParams = {
  port: number;
  productionUrl?: string;
  localServerVars?: Record<string, ServerVariableObject>;
  productionServerVars?: Record<string, ServerVariableObject>;
};

export type ApiServerConfig = {
  url: string;
  description: string;
  variables?: Record<string, ServerVariableObject>;
};

export type ApiServersResult = {
  localServer: ApiServerConfig;
  productionServer: ApiServerConfig;
};
