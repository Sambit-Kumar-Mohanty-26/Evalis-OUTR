const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const versions = await prisma.academicVersion.findMany();
    console.log('Successfully queried AcademicVersion. Count:', versions.length);
  } catch (err) {
    console.error('Error querying AcademicVersion:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
