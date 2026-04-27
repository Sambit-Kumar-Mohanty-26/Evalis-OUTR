const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    try {
        console.log('--- DB CLEANUP INITIATED ---');

        // Delete all soft-deleted records (hard delete)
        const tables = [
            'StudentResult', 'StudentMark', 'StudentSubMark', 'StudentBacklog', 
            'SemesterResult', 'PromotionLog', 'ExamInstance', 'ExamQuestion', 
            'ExamComponent', 'ExamSchema', 'Subject', 'BatchSemester', 'Batch', 
            'Semester', 'Branch', 'AcademicSchool', 'Program', 'OrganizationNode'
        ];

        for (const table of tables) {
            const result = await prisma[table[0].toLowerCase() + table.slice(1)].deleteMany({
                where: { isDeleted: true }
            });
            console.log(`Hard deleted ${result.count} records from ${table}`);
        }

        // Also delete "New Entity" placeholders if any remain active
        const placeholders = await prisma.organizationNode.deleteMany({
            where: { name: 'New Entity' }
        });
        console.log(`Deleted ${placeholders.count} "New Entity" placeholder nodes`);

        console.log('--- CLEANUP COMPLETE ---');
    } catch (e) {
        console.error('Cleanup Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
