import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'src/core/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
