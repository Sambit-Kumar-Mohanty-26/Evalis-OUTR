import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function test() {
  try {
    console.log('Testing DB connection...');
    await db.$connect();
    console.log('Connected.');

    console.log('Fetching a version...');
    const version = await db.academicVersion.findFirst();
    if (!version) {
        console.log('No versions found. Please create one first.');
        return;
    }
    console.log('Using version:', version.id);

    console.log('Creating a dummy program...');
    const program = await db.program.create({
        data: {
            name: 'Test Program ' + Date.now(),
            durationYears: 4,
            versionId: version.id
        }
    });
    console.log('Program created:', program.id);

    console.log('Creating a dummy branch...');
    const branch = await db.branch.create({
        data: {
            name: 'Test Branch ' + Date.now(),
            programId: program.id,
            orgNodeId: null
        }
    });
    console.log('Branch created:', branch.id);

    console.log('Cleaning up...');
    await db.branch.delete({ where: { id: branch.id } });
    await db.program.delete({ where: { id: program.id } });
    console.log('Success!');

  } catch (error) {
    console.error('DB TEST FAILED:', error);
  } finally {
    await db.$disconnect();
  }
}

test();
