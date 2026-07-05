import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from './config';
import { AuthModule } from './core/auth/auth.module';
import { EventsModule } from './core/events';
import { HealthModule } from './core/health/health.module';
import { LoggerModule } from './core/logger/logger.module';
import { PrismaModule } from './core/prisma';
import { EquipamentosModule } from './features/equipamentos/equipamentos.module';
import { InspecoesModule } from './features/inspecoes/inspecoes.module';
import { InventariosModule } from './features/inventarios/inventarios.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EventsModule,
    LoggerModule,
    AuthModule,
    HealthModule,
    EquipamentosModule,
    InventariosModule,
    InspecoesModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
