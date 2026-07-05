import { dateToIsoString } from '@common/schemas/date-to-string';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TipoEquipamentoSchema = z
  .object({
    id: z.string().uuid().describe('ID do tipo de equipamento'),
    nome: z.string().describe('Nome do tipo do equipamento'),
    descricao: z.string().nullable().optional().describe('Descrição do tipo'),
  })
  .meta({ id: 'TipoEquipamento' });

export class TipoEquipamentoDto extends createZodDto(TipoEquipamentoSchema) {}

export const EscolaResumidaSchema = z
  .object({
    id: z.string().uuid().describe('ID da escola'),
    nome: z.string().describe('Nome da escola'),
    codigoInep: z.string().nullable().optional().describe('Código INEP da escola'),
  })
  .meta({ id: 'EscolaResumida' });

export const ProprietarioResumidoSchema = z
  .object({
    id: z.string().uuid().describe('ID do proprietário'),
    nome: z.string().describe('Nome do proprietário'),
    tipo: z.enum(['PROPRIO', 'TERCEIRIZADO']).describe('Tipo de proprietário'),
  })
  .meta({ id: 'ProprietarioResumido' });

export const EquipamentoSchema = z
  .object({
    id: z.string().uuid().describe('ID do equipamento'),
    patrimonio: z.string().nullable().optional().describe('Número de patrimônio'),
    numeroSerie: z.string().nullable().optional().describe('Número de série'),
    tipoEquipamentoId: z.string().uuid().describe('ID do tipo de equipamento'),
    proprietarioId: z.string().uuid().describe('ID do proprietário'),
    marca: z.string().describe('Marca do equipamento'),
    modelo: z.string().describe('Modelo do equipamento'),
    dataAquisicao: dateToIsoString.describe('Data de aquisição'),
    dataDevolucao: dateToIsoString.nullable().optional().describe('Data de devolução prevista'),
    escolaAtualId: z.string().uuid().describe('ID da escola onde o equipamento se encontra'),
    qrCode: z.string().nullable().optional().describe('Código único QR Code'),
    statusOperacional: z
      .enum([
        'OPERANTE',
        'OPERANTE_COM_RESTRICOES',
        'AGUARDANDO_REPARO',
        'EM_MANUTENCAO',
        'INOPERANTE',
        'AGUARDANDO_DEVOLUCAO',
        'BAIXADO',
        'DEVOLVIDO',
      ])
      .describe('Status operacional'),
    statusCadastro: z
      .enum(['PENDENTE', 'EM_ANALISE_DUPLICIDADE', 'APROVADO', 'REJEITADO'])
      .describe('Status do cadastro'),
    condicao: z
      .enum(['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'INUTILIZADO'])
      .describe('Condição física'),
    observacoes: z.string().nullable().optional().describe('Observações'),
    ativo: z.boolean().describe('Indica se o equipamento está ativo'),
    createdAt: dateToIsoString.describe('Data de criação'),
    updatedAt: dateToIsoString.describe('Data da última atualização'),
    tipoEquipamento: TipoEquipamentoSchema.optional().describe('Dados do tipo de equipamento'),
    escolaAtual: EscolaResumidaSchema.optional().describe('Dados da escola atual'),
    proprietario: ProprietarioResumidoSchema.optional().describe('Dados do proprietário'),
  })
  .meta({ id: 'Equipamento' });

export class EquipamentoDto extends createZodDto(EquipamentoSchema) {}

export const EquipamentosPaginatedSchema = z
  .object({
    data: z.array(EquipamentoSchema).describe('Lista de equipamentos'),
    meta: z.object({
      total: z.number().describe('Total de registros encontrados'),
      page: z.number().describe('Página atual'),
      limit: z.number().describe('Itens por página'),
      totalPages: z.number().describe('Total de páginas'),
    }),
  })
  .meta({ id: 'EquipamentosPaginated' });

export class EquipamentosPaginatedDto extends createZodDto(EquipamentosPaginatedSchema) {}
