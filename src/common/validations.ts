import z from 'zod';

// Minimum 8 characters, lower case, upper case, numbers and symbols
export const password = z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/);
