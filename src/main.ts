import { seedDatabase } from '@common/seed-database';
import { setupAdmin } from '@common/setup-admin';
import { LoggerService } from '@core/logger/logger.service';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setAppContext } from './app.registry';
import { ConfigService, type EnvConfig } from './config';
import { setupDocs } from './core/docs/setup.docs';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { buildCorsOptions, getHelmetOptions } from './core/security/security.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get<ConfigService>(ConfigService);
  const host = configService.get<string>('HOST') ?? '0.0.0.0';
  const port = configService.get<number>('PORT') ?? 3000;
  const environment = configService.get<EnvConfig['ENVIRONMENT']>('ENVIRONMENT');

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  setAppContext(app);

  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.use(helmet(getHelmetOptions(environment)));

  app.enableCors(
    buildCorsOptions({
      environment,
      configuredOrigins: configService.get<string>('CORS_ALLOWED_ORIGINS'),
    }),
  );

  const express = await import('express');
  const { join } = await import('path');
  app.use('/public/uploads', express.static(join(process.cwd(), 'uploads')));

  const betterAuthSecret = configService.get<string>('BETTER_AUTH_SECRET');
  if (betterAuthSecret) {
    app.use(cookieParser(betterAuthSecret));
  } else {
    app.use(cookieParser());
  }

  const docsEnabled = await setupDocs(app, port);

  if (configService.get<boolean>('ADMIN_SETUP')) {
    await setupAdmin();
  }

  if (configService.get<boolean>('SEED_ON_START')) {
    await seedDatabase();
  }

  await app.listen(port, host);

  const url = await app.getUrl();
  logger.log(`Server running at ${url}`);
  if (docsEnabled) {
    logger.log(`Documentation available at ${url}/docs`);
  }

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.log(`Received ${signal}. Shutting down gracefully.`);
    await app.close();
    process.exit(0);
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

void bootstrap();
