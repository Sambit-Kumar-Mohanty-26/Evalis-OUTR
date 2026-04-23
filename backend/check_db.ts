const { db } = require('./src/config/db');

async function main() {
  try {
    const versions = await db.academicVersion.findMany({
      take: 1
    });
    console.log('Versions table access check:', versions);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    process.exit(0);
  }
}

main();
