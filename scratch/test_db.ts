
import { db } from '../backend/src/config/db';

async function testConnection() {
    try {
        console.log('Testing database connection...');
        await db.$connect();
        console.log('Database connected successfully!');
        const userCount = await db.user.count();
        console.log('User count:', userCount);
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

testConnection();
