type AppEnvironment = 'development' | 'production' | 'test';

const DEFAULT_CORS_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';

export const DEFAULT_LOCAL_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
] as const;

export function resolveEnvironment(
  environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV,
): AppEnvironment {
  if (environment === 'production' || environment === 'test') {
    return environment;
  }
  return 'development';
}

export function isProductionEnvironment(
  environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV,
) {
  return resolveEnvironment(environment) === 'production';
}

export function parseAllowedOrigins(configuredOrigins?: string) {
  if (!configuredOrigins) {
    return [];
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function getAllowedCorsOrigins(options?: {
  environment?: string;
  configuredOrigins?: string;
}) {
  const environment = resolveEnvironment(options?.environment);
  const configuredOrigins = options?.configuredOrigins ?? process.env.CORS_ALLOWED_ORIGINS;
  const baseOrigins = environment === 'production' ? [] : DEFAULT_LOCAL_CORS_ORIGINS;

  return [...new Set([...baseOrigins, ...parseAllowedOrigins(configuredOrigins)])];
}

export function buildCorsOptions(options?: { environment?: string; configuredOrigins?: string }) {
  return {
    origin: getAllowedCorsOrigins(options),
    methods: DEFAULT_CORS_METHODS,
    optionsSuccessStatus: 204,
    credentials: true,
  };
}

export function shouldEnableDocs(options?: { environment?: string; docsEnabled?: boolean }) {
  const environment = resolveEnvironment(options?.environment);
  if (environment === 'production') {
    return options?.docsEnabled === true;
  }
  return options?.docsEnabled !== false;
}

export function getHelmetOptions(_environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV) {
  return {
    contentSecurityPolicy: false,
  };
}
