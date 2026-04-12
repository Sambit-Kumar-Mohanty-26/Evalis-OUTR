import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaBase = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaBase;
}

export const db = prismaBase;
export const getTenantDB = (tenantId: string) => {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          // 1. Soft Delete Filtering Logic
          // Apply to models that support isDeleted
          const softDeleteModels = ['User', 'Tenant'];

          if (softDeleteModels.includes(model)) {
            if (['findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'count'].includes(operation)) {
              const extendedArgs = args as any;
              extendedArgs.where = extendedArgs.where || {};

              // Only apply if not already explicitly querying isDeleted
              if (extendedArgs.where.isDeleted === undefined) {
                extendedArgs.where.isDeleted = false;
              }
            }
          }

          // 2. Tenant Context Isolation via Transaction
          // This sets the app.current_tenant variable in the session for the duration of the query.
          // This is ideal for Row Level Security (RLS).
          const [, result] = await db.$transaction([
            db.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, TRUE)`,
            query(args),
          ]);

          return result;
        },
      },
    },
  });
};
