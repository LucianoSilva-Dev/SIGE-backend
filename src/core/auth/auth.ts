import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin as adminPlugin, openAPI } from 'better-auth/plugins';
import { PrismaClient } from '../prisma/generated/client';
import { getAllowedCorsOrigins } from '../security/security.config';
import { buildBetterAuthRateLimitConfig, buildSessionCookieAttributes } from './auth.config';
import { betterAuthLogger } from './helpers';
import { ac, adminRole, userRole } from './roles';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const sessionCookieAttributes = buildSessionCookieAttributes();

const _auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  basePath: '/auth',

  logger: {
    level: 'debug',
    log: betterAuthLogger,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 15, // 15 minutes
    },
  },

  advanced: {
    database: {
      generateId: false,
    },
    defaultCookieAttributes: sessionCookieAttributes,
    cookies: {
      session_token: {
        attributes: {
          ...sessionCookieAttributes,
          maxAge: 60 * 60 * 24 * 7,
        },
      },
      session_data: {
        attributes: {
          ...sessionCookieAttributes,
          maxAge: 60 * 60 * 24 * 7,
        },
      },
    },
  },

  trustedOrigins: getAllowedCorsOrigins(),

  plugins: [
    openAPI({ path: '/docs', disableDefaultReference: true }),
    adminPlugin({
      ac,
      roles: { admin: adminRole, user: userRole },
      defaultRole: 'user',
    }),
  ],
  rateLimit: buildBetterAuthRateLimitConfig(),
});

export const auth = _auth as any;

export type Session = any;
export type User = any;

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
