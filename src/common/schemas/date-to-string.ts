import z from 'zod';

export const dateToIsoString = z
  .union([z.string(), z.date()])
  .transform((val) => (val instanceof Date ? val.toISOString() : new Date(val).toISOString()))
  .pipe(z.string())
  .meta({ format: 'date-time' });
