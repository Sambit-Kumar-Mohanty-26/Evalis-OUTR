const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const email = 'sambitkumarmohanty29@gmail.com';
        const users = await prisma.$queryRawUnsafe(`SELECT email, "isDeleted" FROM "User" WHERE email ILIKE '${email}'`);
        console.log('Users found:', JSON.stringify(users, null, 2));
        
        // Also check for similar emails
        const similar = await prisma.$queryRawUnsafe(`SELECT email FROM "User" WHERE email ILIKE '%29%'`);
        console.log('Similar emails:', JSON.stringify(similar, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
