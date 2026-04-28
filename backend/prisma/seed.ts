import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existing = await prisma.tenant.findFirst({ where: { name: 'Evalis Demo' } });
  if (existing) {
    console.log('Seed data already exists. Skipping.');
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: 'Evalis Demo' },
  });

  const passwordHash = await bcrypt.hash('Evalis@2026', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@evalis.io',
      fullName: 'Super Admin',
      passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log(`Tenant created: ${tenant.name} (${tenant.id})`);
  console.log(`Admin created: ${admin.email}`);
  console.log(`Password: Evalis@2026`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
