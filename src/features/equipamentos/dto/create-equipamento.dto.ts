import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateEquipamentoSchema = z
  .object({
    patrimonio: z
      .string()
      .optional()
      .describe('Número de patrimônio (opcional para equipamentos terceirizados)'),
    numeroSerie: z.string().optional().describe('Número de série do equipamento'),
    tipoEquipamentoId: z.string().uuid().describe('ID do tipo do equipamento'),
    proprietarioId: z.string().uuid().describe('ID do proprietário do equipamento'),
    marca: z.string().min(1).describe('Marca do equipamento'),
    modelo: z.string().min(1).describe('Modelo do equipamento'),
    dataAquisicao: z.string().datetime().describe('Data de aquisição do equipamento no formato ISO'),
    escolaAtualId: z.string().uuid().describe('ID da escola para onde o equipamento será enviado'),
    observacoes: z.string().optional().describe('Observações técnicas sobre o equipamento'),
  })
  .meta({ id: 'CreateEquipamento' });

export class CreateEquipamentoDto extends createZodDto(CreateEquipamentoSchema) {}
