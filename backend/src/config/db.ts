import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const dbUrl = new URL(rawConnectionString);
const sslmode = dbUrl.searchParams.get('sslmode');
dbUrl.searchParams.delete('sslmode');
dbUrl.searchParams.delete('ssl');
const connectionString = dbUrl.toString();

const isLocal = ['localhost', '127.0.0.1', '::1'].includes(dbUrl.hostname);
const sslConfig = (isLocal || sslmode === 'disable') ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: sslConfig,
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

// Neon serverless computes auto-suspend when idle. On cold start the first
// connection attempt returns P1001 immediately while the compute wakes up
// (~1-3 s). Retrying after a short delay reliably hits the warmed compute.
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isConnErr =
        msg.includes("Can't reach database server") ||
        msg.includes('P1001') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT');
      if (isConnErr && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * Enhanced DB client for tenant-specific operations.
 * Removed the implicit transaction wrapper to improve stability and prevent pool exhaustion.
 */
export const getTenantDB = (_tenantId: string) => {
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
