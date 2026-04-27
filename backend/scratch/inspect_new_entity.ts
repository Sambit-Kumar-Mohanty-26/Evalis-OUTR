import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Academic Branches ---');
    const branches = await prisma.branch.findMany({
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
        where: { isCurrent: true },
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
        const allBranches = (activeVersion as any).programs.flatMap((p: any) => 
            p.schools.flatMap((s: any) => 
                s.branches.map((b: any) => ({ name: b.name, schoolName: s.name }))
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
