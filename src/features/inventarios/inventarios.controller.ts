import {
  businessLogicErrorSchema,
  validationErrorSchema,
} from '@common/constants/api-response-schemas';
import { CurrentUser, UserPayload } from '@common/decorators/current-user.decorator';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AddItemInventarioDto } from './dto/add-item-inventario.dto';
import { AprovarRejeitarInventarioDto } from './dto/aprovar-rejeitar-inventario.dto';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { InventarioDto, ItemInventarioDto } from './dto/inventario-response.dto';
import { InventariosService } from './inventarios.service';

@ApiTags('Inventarios')
@Controller('inventarios')
@ApiBearerAuth()
export class InventariosController {
  constructor(private readonly inventariosService: InventariosService) {}

  @Post()
  @ApiOperation({
    summary: 'Iniciar Novo Inventário Inicial',
    description: 'Cria um lote de inventário para a escola (status inicial: EM_ELABORACAO).',
  })
  @ZodResponse({
    status: 201,
    type: InventarioDto,
    description: 'Inventário iniciado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação',
    schema: validationErrorSchema,
  })
  async create(@Body() dto: CreateInventarioDto, @CurrentUser() user: UserPayload) {
    return this.inventariosService.create(dto, user);
  }

  @Post(':id/itens')
  @ApiOperation({
    summary: 'Adicionar Item ao Inventário',
    description: 'Adiciona um equipamento/item ao lote de inventário em elaboração.',
  })
  @ZodResponse({
    status: 201,
    type: ItemInventarioDto,
    description: 'Item adicionado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação',
    schema: validationErrorSchema,
  })
  @ApiResponse({
    status: 409,
    description: 'Inventário não está em elaboração',
    schema: businessLogicErrorSchema,
  })
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddItemInventarioDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.inventariosService.addItem(id, dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar Inventários',
    description: 'Retorna a lista de inventários da escola do usuário (ou todos para a SEDUC).',
  })
  @ZodResponse({
    status: 200,
    type: [InventarioDto],
    description: 'Lista de inventários retornada com sucesso',
  })
  async findAll(@CurrentUser() user: UserPayload) {
    return this.inventariosService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter Detalhes do Inventário',
    description: 'Retorna os detalhes do inventário, incluindo seus itens e fotos.',
  })
  @ZodResponse({
    status: 200,
    type: InventarioDto,
    description: 'Inventário retornado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Inventário não encontrado',
    schema: businessLogicErrorSchema,
  })
  async findById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inventariosService.findById(id, user);
  }

  @Patch(':id/enviar-diretor')
  @ApiOperation({
    summary: 'Submeter Inventário para o Diretor',
    description:
      'Conclui a elaboração e envia o lote de inventário para revisão do Diretor Escolar.',
  })
  @ZodResponse({
    status: 200,
    type: InventarioDto,
    description: 'Inventário enviado ao Diretor com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Inventário vazio ou inválido',
    schema: businessLogicErrorSchema,
  })
  async enviarParaDiretor(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inventariosService.enviarParaDiretor(id, user);
  }

  @Patch(':id/aprovar-diretor')
  @ApiOperation({
    summary: 'Aprovação pelo Diretor Escolar',
    description: 'Diretor aprova o lote da sua escola e o encaminha para análise da SEDUC.',
  })
  @ZodResponse({
    status: 200,
    type: InventarioDto,
    description: 'Inventário aprovado pelo Diretor com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas diretores podem realizar esta ação',
    schema: businessLogicErrorSchema,
  })
  async aprovarDiretor(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inventariosService.aprovarDiretor(id, user);
  }

  @Patch(':id/rejeitar-diretor')
  @ApiOperation({
    summary: 'Rejeição pelo Diretor Escolar',
    description: 'Diretor rejeita o lote solicitando correções ao estagiário/técnico.',
  })
  @ZodResponse({
    status: 200,
    type: InventarioDto,
    description: 'Inventário rejeitado com sucesso',
  })
  async rejeitarDiretor(
    @Param('id') id: string,
    @Body() dto: AprovarRejeitarInventarioDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.inventariosService.rejeitarDiretor(id, dto, user);
  }

  @Get(':id/verificar-duplicidades')
  @ApiOperation({
    summary: 'Verificar Duplicidades do Inventário',
    description:
      'Verifica se os itens do inventário possuem correspondência de patrimônio/série na base oficial.',
  })
  async verificarDuplicidades(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inventariosService.verificarDuplicidades(id, user);
  }

  @Patch(':id/aprovar-seduc')
  @ApiOperation({
    summary: 'Aprovação Final pela SEDUC',
    description:
      'SEDUC aprova o inventário, convertendo os itens em equipamentos oficiais com QR Code.',
  })
  @ZodResponse({
    status: 200,
    type: InventarioDto,
    description: 'Inventário aprovado e equipamentos incorporados com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas gestores da SEDUC podem aprovar o inventário',
    schema: businessLogicErrorSchema,
  })
  async aprovarSeduc(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inventariosService.aprovarSeduc(id, user);
  }

  @Patch(':id/rejeitar-seduc')
  @ApiOperation({
    summary: 'Rejeição pela SEDUC',
    description: 'SEDUC rejeita o lote com justificativa.',
  })
  @ZodResponse({
    status: 200,
    type: InventarioDto,
    description: 'Inventário rejeitado pela SEDUC com sucesso',
  })
  async rejeitarSeduc(
    @Param('id') id: string,
    @Body() dto: AprovarRejeitarInventarioDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.inventariosService.rejeitarSeduc(id, dto, user);
  }
}
