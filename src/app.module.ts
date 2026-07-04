import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from './config';
import { AuthModule } from './core/auth/auth.module';
import { EventsModule } from './core/events';
import { HealthModule } from './core/health/health.module';
import { LoggerModule } from './core/logger/logger.module';
import { PrismaModule } from './core/prisma';

@Module({
  imports: [ConfigModule, PrismaModule, EventsModule, LoggerModule, AuthModule, HealthModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
