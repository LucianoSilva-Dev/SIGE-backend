import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const IdOnlyResponseSchema = z.object({
  id: z.cuid(),
});

export class IdOnlyResponseDto extends createZodDto(IdOnlyResponseSchema) {}
