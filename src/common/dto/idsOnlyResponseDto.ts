import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const IdsOnlyResponseSchema = z.object({
  ids: z.array(z.cuid()),
});

export class IdsOnlyResponseDto extends createZodDto(IdsOnlyResponseSchema) {}
