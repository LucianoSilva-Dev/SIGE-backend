import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('readiness')
  getReadiness() {
    return this.healthService.getReadiness();
  }
}
