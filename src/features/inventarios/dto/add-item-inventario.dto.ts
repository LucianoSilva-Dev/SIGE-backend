import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddItemInventarioSchema = z
  .object({
    tipoEquipamentoId: z.string().uuid().describe('ID do tipo do equipamento'),
    patrimonio: z
      .string()
      .optional()
      .describe('Número de patrimônio (opcional para equipamentos terceirizados)'),
    numeroSerie: z.string().optional().describe('Número de série do equipamento'),
    marca: z.string().min(1).describe('Marca do equipamento'),
    modelo: z.string().min(1).describe('Modelo do equipamento'),
    condicao: z
      .enum(['EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'INUTILIZADO'])
      .describe('Condição física inicial'),
    observacoes: z.string().optional().describe('Observações técnicas sobre o item'),
    fotoUrls: z
      .array(z.string().url())
      .optional()
      .describe('Lista de URLs das imagens enviadas como evidência'),
  })
  .meta({ id: 'AddItemInventario' });

export class AddItemInventarioDto extends createZodDto(AddItemInventarioSchema) {}
