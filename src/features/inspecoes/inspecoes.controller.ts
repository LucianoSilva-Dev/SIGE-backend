import {
  businessLogicErrorSchema,
  validationErrorSchema,
} from '@common/constants/api-response-schemas';
import { CurrentUser, UserPayload } from '@common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { CreateInspecaoDto } from './dto/create-inspecao.dto';
import { InspecaoDto } from './dto/inspecao-response.dto';
import { InspecoesService } from './inspecoes.service';

@ApiTags('Inspecoes')
@Controller('inspecoes')
@ApiBearerAuth()
export class InspecoesController {
  constructor(private readonly inspecoesService: InspecoesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('fotos'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Registrar Inspeção Periódica',
    description:
      'Registra uma inspeção em um equipamento. Permite o upload de evidências fotográficas ao abrir um chamado corretivo (condição RUIM ou INUTILIZADO).',
  })
  @ZodResponse({
    status: 201,
    type: InspecaoDto,
    description: 'Inspeção registrada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou fotos enviadas sem chamado/condição ruim',
    schema: validationErrorSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado',
    schema: businessLogicErrorSchema,
  })
  async create(
    @Body() dto: CreateInspecaoDto,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() fotos?: Express.Multer.File[],
  ) {
    return this.inspecoesService.create(dto, user, fotos);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar Inspeções',
    description:
      'Retorna a lista de inspeções (filtrada pela escola do usuário ou todas para SEDUC).',
  })
  @ZodResponse({
    status: 200,
    type: [InspecaoDto],
    description: 'Lista de inspeções retornada com sucesso',
  })
  async findAll(@CurrentUser() user: UserPayload) {
    return this.inspecoesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter Detalhes da Inspeção',
    description: 'Retorna os detalhes de uma inspeção, incluindo fotos e chamados associados.',
  })
  @ZodResponse({
    status: 200,
    type: InspecaoDto,
    description: 'Inspeção encontrada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Inspeção não encontrada',
    schema: businessLogicErrorSchema,
  })
  async findById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inspecoesService.findById(id, user);
  }

  @Patch(':id/aprovar')
  @ApiOperation({
    summary: 'Aprovação pelo Diretor Escolar',
    description: 'Diretor valida/aprova o relatório de inspeção realizada na sua escola.',
  })
  @ZodResponse({
    status: 200,
    type: InspecaoDto,
    description: 'Inspeção aprovada com sucesso pelo Diretor',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas diretores escolares ou SEDUC podem aprovar',
    schema: businessLogicErrorSchema,
  })
  async aprovarDiretor(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.inspecoesService.aprovarDiretor(id, user);
  }
}
