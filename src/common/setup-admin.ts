import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import z from 'zod';
import { auth } from '../core/auth';
import { PrismaClient } from '../core/prisma/generated/client';
import { password } from './validations';

const validateAdmin = z.object({
  ADMIN_NAME: z.string(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: password,
});

export async function setupAdmin() {
  const logger = new Logger('SetupAdmin');
  logger.log('Admin setup initiated.');
  try {
    const {
      ADMIN_EMAIL: email,
      ADMIN_NAME: name,
      ADMIN_PASSWORD: passwordVal,
    } = validateAdmin.parse(process.env);

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });

    const existingAdmin = await prisma.user.findFirst({
      where: { email },
    });

    if (existingAdmin) {
      logger.log(`Admin user with email ${email} already exists.`);
      return;
    }

    const { user } = await auth.api.createUser({
      body: { email, name, password: passwordVal, role: 'admin' },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
    logger.log('Admin setup completed successfully.');
  } catch (e) {
    logger.error('Error in setupAdmin', e instanceof Error ? (e.stack ?? e.message) : String(e));
  }
}
