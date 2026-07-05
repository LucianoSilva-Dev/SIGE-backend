import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const QueryEquipamentoSchema = z
  .object({
    escolaId: z
      .string()
      .uuid()
      .optional()
      .describe(
        'ID da escola. Opcional para SEDUC, forçado para a escola do usuário em perfis escolares.',
      ),
    tipoEquipamentoIds: z
      .string()
      .optional()
      .describe(
        'IDs dos tipos de equipamentos separados por vírgula (ex: id1,id2) para busca por múltiplas categorias.',
      ),
    tipos: z
      .string()
      .optional()
      .describe('Nomes dos tipos de equipamentos separados por vírgula (ex: COMPUTADOR,NOTEBOOK).'),
    condicao: z
      .enum(['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'INUTILIZADO'])
      .optional()
      .describe('Filtro por condição do equipamento.'),
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
      .optional()
      .describe('Filtro por status operacional.'),
    search: z
      .string()
      .optional()
      .describe('Termo de busca por patrimônio, número de série, marca ou modelo.'),
    page: z.coerce.number().int().min(1).default(1).describe('Página atual da listagem'),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Quantidade de itens por página'),
  })
  .meta({ id: 'QueryEquipamento' });

export class QueryEquipamentoDto extends createZodDto(QueryEquipamentoSchema) {}
