import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateInspecaoSchema = z
  .object({
    equipamentoId: z.string().uuid().describe('ID do equipamento inspecionado'),
    condicaoEncontrada: z
      .enum(['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'INUTILIZADO'])
      .describe('Condição física encontrada no equipamento durante a inspeção'),
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
      .describe('Novo status operacional se alterado na inspeção'),
    observacoes: z.string().optional().describe('Observações técnicas encontradas na inspeção'),
    gerarChamado: z
      .preprocess((val) => val === 'true' || val === true || val === '1' || val === 1, z.boolean())
      .optional()
      .default(false)
      .describe('Indica se deseja abrir um chamado corretivo diretamente a partir desta inspeção'),
    descricaoChamado: z
      .string()
      .optional()
      .describe('Descrição detalhada do problema caso gerarChamado seja verdadeiro'),
  })
  .meta({ id: 'CreateInspecao' });

export class CreateInspecaoDto extends createZodDto(CreateInspecaoSchema) {}
