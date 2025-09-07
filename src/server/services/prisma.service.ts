import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

config();

//* If DATABASE_URL uses relative path, resolve it relative to project root
if (process.env['DATABASE_URL']?.startsWith('file:./')) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, '../../..');
  const dbFileName = process.env['DATABASE_URL'].replace('file:./', '');
  const resolvedPath = `file:${join(projectRoot, dbFileName).replace(/\\/g, '/')}`;
  process.env['DATABASE_URL'] = resolvedPath;
}

import { PrismaClient } from '../../../generated/prisma/client';

class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

export const prisma = PrismaService.getInstance();
export default PrismaService;
