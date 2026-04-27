const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const email = 'sambitkumarmohanty29@gmail.com';
        // Check if user exists first
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found.');
            return;
        }

        // Delete related records if necessary, though Cascade should handle it if defined.
        // Prisma delete handles unique constraints.
        const deleted = await prisma.user.delete({ where: { email } });
        console.log('User deleted successfully:', deleted.email);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

run();
