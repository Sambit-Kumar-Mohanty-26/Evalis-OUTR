import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ 
  connectionString,
  max: 20, // Increase pool size to prevent exhaustion during complex academic transactions
  connectionTimeoutMillis: 10000, 
  idleTimeoutMillis: 30000
});
const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaBase = global.prisma || new PrismaClient({
  adapter,
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaBase;
}

export const db = prismaBase;

/**
 * Enhanced DB client for tenant-specific operations.
 * Removed the implicit transaction wrapper to improve stability and prevent pool exhaustion.
 */
export const getTenantDB = (tenantId: string) => {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          // Soft Delete logic remains standard
          const softDeleteModels = ['User', 'Tenant'];
          if (softDeleteModels.includes(model)) {
            if (['findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'count'].includes(operation)) {
              if (args.where && args.where.isDeleted === undefined) {
                args.where.isDeleted = false;
              }
            }
          }
          
          // Execute the query normally
          return query(args);
        },
      },
    },
  });
};
