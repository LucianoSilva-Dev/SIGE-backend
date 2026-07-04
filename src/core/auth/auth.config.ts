import type { BetterAuthRateLimitOptions } from 'better-auth';
import { isProductionEnvironment, resolveEnvironment } from '../security/security.config';

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function resolveCookieSameSite(
  sameSite = process.env.AUTH_COOKIE_SAME_SITE,
): 'lax' | 'strict' | 'none' {
  if (sameSite === 'strict' || sameSite === 'none') {
    return sameSite;
  }
  return 'lax';
}

function resolveCookieSecure(
  environment: string | undefined,
  secureOverride = process.env.AUTH_COOKIE_SECURE,
) {
  if (secureOverride === 'true') {
    return true;
  }
  if (secureOverride === 'false') {
    return false;
  }
  return isProductionEnvironment(environment);
}

export function buildSessionCookieAttributes(
  environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV,
  env: NodeJS.ProcessEnv = process.env,
) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: resolveCookieSameSite(env.AUTH_COOKIE_SAME_SITE),
    secure: resolveCookieSecure(environment, env.AUTH_COOKIE_SECURE),
  };
}

export function buildBetterAuthRateLimitConfig(
  env: NodeJS.ProcessEnv = process.env,
): BetterAuthRateLimitOptions {
  const environment = resolveEnvironment(env.ENVIRONMENT ?? env.NODE_ENV);
  const isExplicitlyDisabled = env.AUTH_RATE_LIMIT_ENABLED === 'false';
  const isExplicitlyEnabled = env.AUTH_RATE_LIMIT_ENABLED === 'true';

  return {
    enabled: isExplicitlyDisabled ? false : isExplicitlyEnabled || environment !== 'test',
    window: Number(env.AUTH_RATE_LIMIT_WINDOW) || 60,
    max: Number(env.AUTH_RATE_LIMIT_MAX) || 100,
    customRules: {
      '/sign-in/email': {
        window: 10,
        max: 5,
      },
      '/sign-up/email': {
        window: 60,
        max: 3,
      },
    },
  };
}

export function buildSessionCookieConfig(
  environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV,
  env: NodeJS.ProcessEnv = process.env,
) {
  return {
    attributes: {
      ...buildSessionCookieAttributes(environment, env),
      maxAge: SESSION_COOKIE_MAX_AGE,
    },
  };
}
