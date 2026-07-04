import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class RouteIdParameterDto extends createZodDto(
  z.object({
    id: z.cuid('O id deve conter um valor válido'),
  }),
) {}
