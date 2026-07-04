import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const NullResponseDTO = createZodDto(z.null());
