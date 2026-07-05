import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateInventarioSchema = z
  .object({
    escolaId: z
      .string()
      .uuid()
      .optional()
      .describe(
        'ID da escola para a qual o inventário está sendo criado. Opcional para usuários escolares.',
      ),
  })
  .meta({ id: 'CreateInventario' });

export class CreateInventarioDto extends createZodDto(CreateInventarioSchema) {}
