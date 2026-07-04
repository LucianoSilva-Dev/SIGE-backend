import z from 'zod';

const envSchema = z
  .object({
    // Base Config
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    ENVIRONMENT: z.preprocess(
      (value) => value ?? process.env.NODE_ENV ?? 'development',
      z.enum(['development', 'production', 'test']),
    ),
    TZ: z.string().default('America/Sao_Paulo'),
    API_URL: z.string().optional(),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    DOCS_ENABLED: z
      .preprocess((value) => {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
      }, z.boolean().optional())
      .optional(),

    // Authentication (better-auth)
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    BETTER_AUTH_URL: z.string().min(1, 'BETTER_AUTH_URL is required'),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional().default('lax'),
    AUTH_COOKIE_SECURE: z
      .preprocess((value) => {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
      }, z.boolean().optional())
      .optional(),

    // Admin Setup
    ADMIN_SETUP: z
      .preprocess((val) => val === 'true', z.boolean())
      .optional()
      .default(false),
    ADMIN_NAME: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.ADMIN_SETUP) {
        return !!data.ADMIN_NAME && !!data.ADMIN_EMAIL && !!data.ADMIN_PASSWORD;
      }
      return true;
    },
    {
      message: 'ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required when ADMIN_SETUP is true',
    },
  );

export { envSchema };
export type EnvConfig = z.infer<typeof envSchema>;

export default () => {
  return envSchema.parse(process.env);
};
