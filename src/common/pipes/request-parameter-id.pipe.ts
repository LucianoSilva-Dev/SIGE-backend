import { ZodValidationPipe } from 'nestjs-zod';
import z from 'zod';

export function RequestParameterIdPipe(idName: string) {
  return new ZodValidationPipe(z.cuid(`"${idName}" deve conter um valor válido`));
}
