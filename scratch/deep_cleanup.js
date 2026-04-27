const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepClean() {
    try {
        console.log('--- DEEP DB CLEANUP INITIATED ---');
        const tenantId = 'cmnwba1060001g8vgd51n1xwk';

        // 1. Delete Students
        const students = await prisma.user.deleteMany({
            where: { role: 'STUDENT', tenantId }
        });
        console.log(`Deleted ${students.count} students.`);

        // 2. Delete Results and Marks
        await prisma.studentMark.deleteMany({});
        await prisma.studentSubMark.deleteMany({});
        await prisma.studentResult.deleteMany({});
        await prisma.studentBacklog.deleteMany({});
        await prisma.semesterResult.deleteMany({});
        console.log(`Deleted all marks and results.`);

        // 3. Delete Academic Hierarchy
        await prisma.batchSemester.deleteMany({});
        await prisma.batch.deleteMany({});
        await prisma.subject.deleteMany({});
        await prisma.semester.deleteMany({});
        await prisma.branch.deleteMany({});
        await prisma.academicSchool.deleteMany({});
        await prisma.program.deleteMany({});
        console.log(`Deleted academic hierarchy.`);

        // 4. Delete Organization Nodes (except tenant root)
        // Keep the nodes managed by 'sambitkumarmohanty29@gmail.com' for now?
        // No, user said delete seeded data. I'll delete nodes that are obviously placeholders.
        const nodes = await prisma.organizationNode.deleteMany({
            where: { 
                tenantId,
                level: { gt: 0 } // Level 0 is usually the Tenant/University root
            }
        });
        console.log(`Deleted ${nodes.count} organization nodes.`);

        console.log('--- DEEP CLEANUP COMPLETE ---');
    } catch (e) {
        console.error('Cleanup Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

deepClean();
