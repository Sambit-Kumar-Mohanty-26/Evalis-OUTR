import { db } from '../config/db';

async function deepClean() {
    try {
        console.log('--- DEEP DB CLEANUP INITIATED ---');
        const tenantId = 'cmnwba1060001g8vgd51n1xwk';

        console.log('--- DEEP DB TRUNCATE INITIATED ---');
        
        const tables = [
            'AuditLog', 'RefreshToken', 'StudentMark', 'StudentSubMark', 'StudentResult', 
            'StudentBacklog', 'SemesterResult', 'PromotionLog', 'BatchSemester', 
            'ExamInstance', 'Batch', 'Subject', 'Semester', 'Branch', 
            'AcademicSchool', 'Program', 'AcademicVersion', 'ExamSchema'
        ];

        for (const table of tables) {
            try {
                await db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`Truncated ${table}`);
            } catch (e: any) {
                console.warn(`Truncate failed for ${table}:`, e.message);
            }
        }

        // Delete students (User table can't be truncated as it has admins)
        const students = await db.user.deleteMany({
            where: { role: 'STUDENT', tenantId }
        });
        console.log(`Deleted ${students.count} students.`);


        // Handle OrganizationNodes carefully level by level
        const maxLevel = await db.organizationNode.aggregate({
            _max: { level: true },
            where: { tenantId }
        });

        if (maxLevel._max.level !== null) {
            for (let l = maxLevel._max.level; l > 0; l--) {
                const deleted = await db.organizationNode.deleteMany({
                    where: { tenantId, level: l }
                });
                console.log(`Deleted ${deleted.count} nodes at level ${l}.`);
            }
        }




        console.log('--- DEEP CLEANUP COMPLETE ---');
    } catch (e) {
        console.error('Cleanup Error:', e);
    } finally {
        process.exit();
    }
}

deepClean();
