import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AprovarRejeitarInventarioSchema = z
  .object({
    justificativa: z
      .string()
      .optional()
      .describe('Justificativa para a decisão (obrigatória em caso de rejeição)'),
  })
  .meta({ id: 'AprovarRejeitarInventario' });

export class AprovarRejeitarInventarioDto extends createZodDto(AprovarRejeitarInventarioSchema) {}
