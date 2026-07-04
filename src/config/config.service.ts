import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type { EnvConfig } from './env.schema';

@Injectable()
export class ConfigService extends NestConfigService<EnvConfig, true> {}
