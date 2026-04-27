import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Academic Branches ---');
    const branches = await prisma.academicBranch.findMany({
        where: { name: { contains: 'New Entity' } },
        include: { school: true }
    });
    console.log('Branches found:', JSON.stringify(branches, null, 2));

    console.log('\n--- Inspecting Batches ---');
    const batches = await prisma.batch.findMany({
        where: { name: { contains: 'New Entity' } },
        include: { branch: true }
    });
    console.log('Batches found:', JSON.stringify(batches, null, 2));

    console.log('\n--- Current Active Blueprint ---');
    const activeVersion = await prisma.academicVersion.findFirst({
        where: { status: 'ACTIVE' },
        include: {
            programs: {
                include: {
                    schools: {
                        include: {
                            branches: true
                        }
                    }
                }
            }
        }
    });
    
    if (activeVersion) {
        console.log('Active Version ID:', activeVersion.id);
        const allBranches = activeVersion.programs.flatMap(p => 
            p.schools.flatMap(s => 
                s.branches.map(b => ({ name: b.name, schoolName: s.name }))
            )
        );
        console.log('All branches in active blueprint:', allBranches);
    } else {
        console.log('No active version found.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
