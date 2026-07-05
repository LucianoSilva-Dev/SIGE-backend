import {
  businessLogicErrorSchema,
  validationErrorSchema,
} from '@common/constants/api-response-schemas';
import { CurrentUser, UserPayload } from '@common/decorators/current-user.decorator';
import {
  Controller as NestController,
  Get as NestGet,
  Param as NestParam,
  Query as NestQuery,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import {
  EquipamentoDto,
  EquipamentosPaginatedDto,
  TipoEquipamentoDto,
} from './dto/equipamento-response.dto';
import { QueryEquipamentoDto } from './dto/query-equipamento.dto';
import { EquipamentosService } from './equipamentos.service';

@ApiTags('Equipamentos')
@NestController('equipamentos')
@ApiBearerAuth()
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  @NestGet()
  @ApiOperation({
    summary: 'Listar / Verificar Inventário de Equipamentos',
    description:
      'Retorna equipamentos com suporte a busca modular por múltiplas categorias e restrição por escola do usuário.',
  })
  @ZodResponse({
    status: 200,
    type: EquipamentosPaginatedDto,
    description: 'Lista de equipamentos retornada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação',
    schema: validationErrorSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado',
    schema: businessLogicErrorSchema,
  })
  async findAll(@NestQuery() query: QueryEquipamentoDto, @CurrentUser() user: UserPayload) {
    return this.equipamentosService.findAll(query, user);
  }

  @NestGet('tipos')
  @ApiOperation({
    summary: 'Listar Categorias / Tipos de Equipamentos',
    description: 'Retorna todas as categorias/tipos de equipamentos disponíveis no sistema.',
  })
  @ZodResponse({
    status: 200,
    type: [TipoEquipamentoDto],
    description: 'Lista de tipos de equipamento retornada com sucesso',
  })
  async findAllTipos(): Promise<TipoEquipamentoDto[]> {
    return this.equipamentosService.findAllTipos();
  }

  @NestGet('qr/:qrCode')
  @ApiOperation({
    summary: 'Buscar Equipamento por QR Code',
    description: 'Retorna os dados do equipamento escaneado através do seu código QR único.',
  })
  @ZodResponse({
    status: 200,
    type: EquipamentoDto,
    description: 'Equipamento encontrado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
    schema: businessLogicErrorSchema,
  })
  async findByQrCode(@NestParam('qrCode') qrCode: string, @CurrentUser() user: UserPayload) {
    return this.equipamentosService.findByQrCode(qrCode, user);
  }

  @NestGet(':id')
  @ApiOperation({
    summary: 'Obter Detalhes do Equipamento',
    description: 'Retorna a ficha completa do equipamento com histórico e evidências fotográficas.',
  })
  @ZodResponse({
    status: 200,
    type: EquipamentoDto,
    description: 'Detalhes do equipamento retornados com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
    schema: businessLogicErrorSchema,
  })
  async findById(@NestParam('id') id: string, @CurrentUser() user: UserPayload) {
    return this.equipamentosService.findById(id, user);
  }
}
