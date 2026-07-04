import type { ApiServersResult, BuildApiServersParams } from '../docs.types';

export function buildApiServers({
  port,
  productionUrl,
  localServerVars,
  productionServerVars,
}: BuildApiServersParams): ApiServersResult {
  const localUrl = `http://localhost:${port}`;

  return {
    localServer: {
      url: localUrl,
      description: 'Local development server',
      variables: localServerVars,
    },
    productionServer: {
      url: productionUrl ?? localUrl,
      description: productionUrl ? 'Production server' : 'Local development server',
      variables: productionServerVars,
    },
  };
}
