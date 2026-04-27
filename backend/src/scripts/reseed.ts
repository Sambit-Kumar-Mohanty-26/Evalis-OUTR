import { db } from '../config/db';
import * as bcrypt from 'bcrypt';

async function reseed() {
    try {
        console.log('--- CLEAN RE-SEED INITIATED ---');
        const tenantId = 'cmnwba1060001g8vgd51n1xwk';
        const rootNodeId = '358d64c1-4e2e-494b-8713-23b64f48371a';

        // 1. Recreate HOS User
        const passwordHash = await bcrypt.hash('Evalis@2026', 12);
        const hos = await db.user.create({
            data: {
                fullName: 'Sambit Kumar Mohanty',
                email: 'sambitkumarmohanty29@gmail.com',
                passwordHash,
                role: 'HEAD_OF_SCHOOL',
                tenantId,
                onboardingRequired: false
            }
        });
        console.log('Created HOS user.');

        // 2. Create Program/Course Node (Level 1)
        const programNode = await db.organizationNode.create({
            data: {
                name: 'B.Tech',
                type: 'Course',
                level: 1,
                parentId: rootNodeId,
                tenantId
            }
        });

        // 3. Create School Node (Level 2)
        const schoolNode = await db.organizationNode.create({
            data: {
                name: 'School of Computer Science',
                type: 'School',
                level: 2,
                parentId: programNode.id,
                tenantId,
                admins: { connect: { id: hos.id } }
            }
        });
        console.log('Created School node and linked to HOS.');

        // 4. Create Branch Nodes (Level 3)
        const cseNode = await db.organizationNode.create({
            data: {
                name: 'CSE',
                type: 'Branch',
                level: 3,
                parentId: schoolNode.id,
                tenantId
            }
        });
        const itNode = await db.organizationNode.create({
            data: {
                name: 'IT',
                type: 'Branch',
                level: 3,
                parentId: schoolNode.id,
                tenantId
            }
        });
        console.log('Created CSE and IT branch nodes.');

        // 5. Create Academic Records
        const version = await db.academicVersion.create({
            data: { name: 'R24 Syllabus', isCurrent: true, tenantId }
        });

        const program = await db.program.create({
            data: { 
                name: 'B.Tech', 
                versionId: version.id, 
                orgNodeId: programNode.id 
            }
        });

        const school = await db.academicSchool.create({
            data: { 
                name: 'School of Computer Science', 
                programId: program.id, 
                orgNodeId: schoolNode.id 
            }
        });

        const cseBranch = await db.branch.create({
            data: { 
                name: 'CSE', 
                schoolId: school.id, 
                orgNodeId: cseNode.id 
            }
        });
        const itBranch = await db.branch.create({
            data: { 
                name: 'IT', 
                schoolId: school.id, 
                orgNodeId: itNode.id 
            }
        });

        // 6. Create Batches
        const academicYear = await db.academicYear.create({
            data: {
                name: '2024-2025',
                startDate: new Date('2024-07-01'),
                endDate: new Date('2025-06-30'),
                isCurrent: true,
                tenantId
            }
        });

        await db.batch.createMany({
            data: [
                { name: 'CSE 2023-27', branchId: cseBranch.id, academicYearId: academicYear.id, startYear: 2023, endYear: 2027 },
                { name: 'CSE 2024-28', branchId: cseBranch.id, academicYearId: academicYear.id, startYear: 2024, endYear: 2028 },
                { name: 'IT 2023-27', branchId: itBranch.id, academicYearId: academicYear.id, startYear: 2023, endYear: 2027 },
                { name: 'IT 2024-28', branchId: itBranch.id, academicYearId: academicYear.id, startYear: 2024, endYear: 2028 }
            ]
        });

        console.log('--- RE-SEED COMPLETE ---');
    } catch (e) {
        console.error('Re-seed Error:', e);
    } finally {
        process.exit();
    }
}

reseed();
