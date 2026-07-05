import { Module } from '@nestjs/common';
import { InspecoesController } from './inspecoes.controller';
import { InspecoesService } from './inspecoes.service';

@Module({
  controllers: [InspecoesController],
  providers: [InspecoesService],
  exports: [InspecoesService],
})
export class InspecoesModule {}
