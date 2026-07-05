import { dateToIsoString } from '@common/schemas/date-to-string';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TipoEquipamentoSchema } from '../../equipamentos/dto/equipamento-response.dto';

export const ItemInventarioSchema = z
  .object({
    id: z.string().uuid().describe('ID único do item no inventário'),
    inventarioId: z.string().uuid().describe('ID do inventário ao qual pertence'),
    patrimonio: z.string().nullable().optional().describe('Número de patrimônio'),
    numeroSerie: z.string().nullable().optional().describe('Número de série'),
    tipoEquipamentoId: z.string().uuid().describe('ID do tipo de equipamento'),
    marca: z.string().describe('Marca do equipamento'),
    modelo: z.string().describe('Modelo do equipamento'),
    condicao: z
      .enum(['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'INUTILIZADO'])
      .describe('Condição física'),
    observacoes: z.string().nullable().optional().describe('Observações'),
    createdAt: dateToIsoString.describe('Data de cadastro do item'),
    updatedAt: dateToIsoString.describe('Data de atualização do item'),
    tipoEquipamento: TipoEquipamentoSchema.optional().describe('Dados do tipo de equipamento'),
  })
  .meta({ id: 'ItemInventario' });

export class ItemInventarioDto extends createZodDto(ItemInventarioSchema) {}

export const InventarioSchema = z
  .object({
    id: z.string().uuid().describe('ID único do inventário'),
    escolaId: z.string().uuid().describe('ID da escola do inventário'),
    criadoPorId: z.string().uuid().describe('ID do usuário criador'),
    status: z
      .enum([
        'EM_ELABORACAO',
        'AGUARDANDO_APROVACAO_DIRETOR',
        'AGUARDANDO_APROVACAO_SEDUC',
        'APROVADO',
        'REJEITADO',
      ])
      .describe('Status atual no fluxo de aprovação'),
    justificativaRejeicao: z
      .string()
      .nullable()
      .optional()
      .describe('Motivo da rejeição se houver'),
    enviadoDiretorEm: dateToIsoString
      .nullable()
      .optional()
      .describe('Data de envio para o Diretor'),
    aprovadoDiretorEm: dateToIsoString
      .nullable()
      .optional()
      .describe('Data de aprovação pelo Diretor'),
    enviadoSeducEm: dateToIsoString.nullable().optional().describe('Data de envio para a SEDUC'),
    aprovadoSeducEm: dateToIsoString
      .nullable()
      .optional()
      .describe('Data de aprovação final pela SEDUC'),
    createdAt: dateToIsoString.describe('Data de criação'),
    updatedAt: dateToIsoString.describe('Data da última atualização'),
    itens: z.array(ItemInventarioSchema).optional().describe('Itens pertencentes ao inventário'),
  })
  .meta({ id: 'Inventario' });

export class InventarioDto extends createZodDto(InventarioSchema) {}
