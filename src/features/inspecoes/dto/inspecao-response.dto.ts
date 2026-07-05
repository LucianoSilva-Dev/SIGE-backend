import { dateToIsoString } from '@common/schemas/date-to-string';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EquipamentoSchema } from '../../equipamentos/dto/equipamento-response.dto';

export const InspecaoSchema = z
  .object({
    id: z.string().uuid().describe('ID único da inspeção'),
    equipamentoId: z.string().uuid().describe('ID do equipamento inspecionado'),
    usuarioId: z.string().uuid().describe('ID do responsável pela inspeção'),
    dataRealizacao: dateToIsoString.describe('Data e hora da realização da inspeção'),
    condicaoEncontrada: z
      .enum(['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'INUTILIZADO'])
      .describe('Condição encontrada'),
    observacoes: z.string().nullable().optional().describe('Observações da inspeção'),
    aprovadoDiretor: z.boolean().nullable().optional().describe('Aprovado pelo diretor escolar'),
    aprovadoEm: dateToIsoString.nullable().optional().describe('Data de aprovação pelo diretor'),
    createdAt: dateToIsoString.describe('Data de criação'),
    updatedAt: dateToIsoString.describe('Data de atualização'),
    equipamento: EquipamentoSchema.optional().describe('Dados do equipamento'),
    usuario: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string(),
        cargo: z.string().nullable().optional(),
      })
      .optional()
      .describe('Dados do usuário responsável'),
    chamados: z
      .array(
        z.object({
          id: z.string().uuid(),
          descricao: z.string(),
          status: z.string(),
          createdAt: dateToIsoString,
        }),
      )
      .optional()
      .describe('Chamados corretivos abertos nesta inspeção'),
  })
  .meta({ id: 'Inspecao' });

export class InspecaoDto extends createZodDto(InspecaoSchema) {}
