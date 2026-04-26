import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.batch.findMany({
    include: {
      branch: {
        include: {
          school: true
        }
      }
    }
  });

  const processed = batches.map(b => ({
    id: b.id,
    name: b.name,
    branchId: b.branch?.id,
    branchName: b.branch?.name,
    schoolId: b.branch?.school?.id,
    schoolName: b.branch?.school?.name
  }));

  console.log(JSON.stringify(processed, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
