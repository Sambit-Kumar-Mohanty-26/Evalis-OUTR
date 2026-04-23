import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

export const createVersion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, isCurrent, mappingData } = req.body;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.userId;

        if (!tenantId || !userId) {
            res.status(401).json({ error: 'Tenant context required.' });
            return;
        }

        // 1. Pre-fetch ALL organization nodes for this tenant to avoid N+1 queries in loops
        const allOrgNodes = await db.organizationNode.findMany({
            where: { tenantId, isDeleted: false }
        });
        const nodesByParentId = new Map();
        const nodesById = new Map();
        allOrgNodes.forEach(node => {
            nodesById.set(node.id, node);
            if (node.parentId) {
                const children = nodesByParentId.get(node.parentId) || [];
                children.push(node);
                nodesByParentId.set(node.parentId, children);
            }
        });

        const version = await db.$transaction(async (tx: any) => {
            // If isCurrent: true, unset others
            if (isCurrent) {
                await tx.academicVersion.updateMany({
                    where: { tenantId, isDeleted: false },
                    data: { isCurrent: false }
                });
            }

            const newVersion = await tx.academicVersion.create({
                data: {
                    name,
                    isCurrent: isCurrent || false,
                    tenantId
                }
            });

            // Handle Smart Mapping if mappingData exists
            if (mappingData && Array.isArray(mappingData)) {
                for (const item of mappingData) {
                    // 1. Resolve Program Node (Level 1)
                    const programNode = nodesById.get(item.nodeId);
                    if (!programNode) continue;

                    const program = await tx.program.create({
                        data: {
                            name: programNode.name,
                            durationYears: parseInt(item.durationYears) || 4,
                            versionId: newVersion.id,
                            orgNodeId: item.nodeId
                        }
                    });

                    // 2. Resolve Schools (Level 2 children) from memory
                    const schoolNodes = nodesByParentId.get(item.nodeId) || [];

                    for (const sNode of schoolNodes) {
                        const school = await tx.academicSchool.create({
                            data: {
                                name: sNode.name,
                                programId: program.id,
                                orgNodeId: sNode.id
                            }
                        });

                        // 3. Resolve Branches (Level 3 children) from memory
                        const branchNodes = nodesByParentId.get(sNode.id) || [];

                        for (const bNode of branchNodes) {
                            const branch = await tx.branch.create({
                                data: {
                                    name: bNode.name,
                                    schoolId: school.id,
                                    orgNodeId: bNode.id
                                }
                            });

                            // 4. Bulk generate Semesters
                            const totalSemesters = (parseInt(item.durationYears) || 4) * 2;
                            const semesters = Array.from({ length: totalSemesters }, (_, i) => ({
                                semesterNumber: i + 1,
                                branchId: branch.id
                            }));

                            await tx.semester.createMany({
                                data: semesters
                            });
                        }
                    }
                }
            }

            return newVersion;
        }, { 
            timeout: 60000, // 60s processing limit
            maxWait: 20000  // 20s pool wait limit to resolve "Unable to start transaction"
        });

        // Audit Log
        await db.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'AcademicVersion',
                entityId: version.id,
                metadata: { 
                    name: version.name, 
                    isCurrent: version.isCurrent,
                    syncedPrograms: mappingData?.length || 0 
                }
            }
        });

        res.status(201).json(version);
    } catch (error: any) {
        console.error('CREATE VERSION ERROR:', error);
        res.status(500).json({ error: 'Failed to initialize academic blueprint: ' + (error.message || 'Unknown error') });
    }
};

export const getVersions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ error: 'Tenant context missing.' });
            return;
        }

        const versions = await db.academicVersion.findMany({
            where: { tenantId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(versions);
    } catch (error: any) {
        console.error('GET VERSIONS ERROR:', error);
        res.status(500).json({ error: 'Failed to retrieve blueprint versions: ' + (error.message || 'Unknown error') });
    }
};

export const deleteVersion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        await db.academicVersion.update({
            where: { id: id as string },
            data: { isDeleted: true }
        });

        // Audit Log
        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'DELETE',
                    entity: 'AcademicVersion',
                    entityId: id as string,
                    metadata: { message: 'Blueprint version archived' }
                }
            });
        }

        res.status(200).json({ message: 'Blueprint version archived.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive blueprint.' });
    }
};

export const syncVersion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.userId;

        if (!tenantId || !userId) {
            res.status(401).json({ error: 'Tenant context required.' });
            return;
        }

        const syncResult = await db.$transaction(async (tx: any) => {
            // 1. Fetch current non-deleted version structure into memory
            const version = await tx.academicVersion.findUnique({
                where: { id, tenantId },
                include: {
                    programs: {
                        where: { isDeleted: false },
                        include: {
                            schools: {
                                where: { isDeleted: false },
                                include: {
                                    branches: {
                                        where: { isDeleted: false }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!version) throw new Error('Blueprint version not found.');

            // 2. Fetch latest Organization Structure (non-deleted)
            const orgNodes = await tx.organizationNode.findMany({
                where: { tenantId, isDeleted: false }
            });

            // 3. TRACKING MAPS for efficient lookup (O(1) instead of nested loops)
            const existingProgramsByOrgNode = new Map(version.programs.map((p: any) => [p.orgNodeId, p]));
            const existingSchoolsByOrgNode = new Map(version.programs.flatMap((p: any) => p.schools).map((s: any) => [s.orgNodeId, s]));
            const existingBranchesByOrgNode = new Map(version.programs.flatMap((p: any) => p.schools).flatMap((s: any) => s.branches).map((b: any) => [b.orgNodeId, b]));

            // Also map academic school ID back to its program for duration lookup
            const schoolIdToProgram = new Map();
            version.programs.forEach((p: any) => {
                p.schools.forEach((s: any) => schoolIdToProgram.set(s.id, p));
            });

            const activeOrgNodeIds = new Set(orgNodes.map((n: any) => n.id));
            let added = 0;
            let updated = 0;
            let deletedCount = 0;

            const level1Nodes = orgNodes.filter((n: any) => n.level === 1);
            const level2Nodes = orgNodes.filter((n: any) => n.level === 2);
            const level3Nodes = orgNodes.filter((n: any) => n.level === 3);

            const academicProgramMapByNodeId: Record<string, string> = {};
            const academicSchoolMapByNodeId: Record<string, string> = {};

            // --- Level 1: Programs (Courses) ---
            for (const node of level1Nodes) {
                let prog = existingProgramsByOrgNode.get(node.id) as any;
                if (!prog) {
                    const duration = node.name.toUpperCase().includes('M.') ? 2 : 4; 
                    prog = await tx.program.create({
                        data: {
                            name: node.name,
                            durationYears: duration,
                            versionId: version.id,
                            orgNodeId: node.id
                        }
                    });
                    added++;
                    // Update our in-memory maps for next steps if needed
                    existingProgramsByOrgNode.set(node.id, prog);
                } else if (prog.name !== node.name) {
                    prog = await tx.program.update({
                        where: { id: (prog as any).id },
                        data: { name: node.name }
                    });
                    updated++;
                }
                academicProgramMapByNodeId[node.id] = (prog as any).id;
            }

            // Archive orphan programs
            const orphanProgIds = version.programs
                .filter((p: any) => p.orgNodeId && !activeOrgNodeIds.has(p.orgNodeId))
                .map((p: any) => p.id);
            if (orphanProgIds.length > 0) {
                await tx.program.updateMany({ where: { id: { in: orphanProgIds } }, data: { isDeleted: true } });
                deletedCount += orphanProgIds.length;
            }

            // --- Level 2: Schools ---
            for (const node of level2Nodes) {
                const parentAcademicProgId = node.parentId ? academicProgramMapByNodeId[node.parentId] : null;
                if (!parentAcademicProgId) continue;

                let existingSchool = existingSchoolsByOrgNode.get(node.id) as any;
                if (!existingSchool) {
                    existingSchool = await tx.academicSchool.create({
                        data: { name: node.name, programId: parentAcademicProgId, orgNodeId: node.id }
                    });
                    added++;
                    existingSchoolsByOrgNode.set(node.id, existingSchool);
                    // Map this new school to its program for Level 3 duration lookup
                    const prog = existingProgramsByOrgNode.get(node.parentId as string);
                    if (prog) schoolIdToProgram.set((existingSchool as any).id, prog);
                } else if ((existingSchool as any).name !== node.name || (existingSchool as any).programId !== parentAcademicProgId) {
                    existingSchool = await tx.academicSchool.update({
                        where: { id: (existingSchool as any).id },
                        data: { name: node.name, programId: parentAcademicProgId }
                    });
                    updated++;
                }
                academicSchoolMapByNodeId[node.id] = (existingSchool as any).id;
            }

            // Archive orphan schools
            const orphanSchoolIds = Array.from(existingSchoolsByOrgNode.values())
                .filter((s: any) => s.orgNodeId && !activeOrgNodeIds.has(s.orgNodeId))
                .map((s: any) => s.id);
            if (orphanSchoolIds.length > 0) {
                await tx.academicSchool.updateMany({ where: { id: { in: orphanSchoolIds } }, data: { isDeleted: true } });
                deletedCount += orphanSchoolIds.length;
            }

            // --- Level 3: Branches ---
            for (const node of level3Nodes) {
                const parentAcademicSchoolId = node.parentId ? academicSchoolMapByNodeId[node.parentId] : null;
                if (!parentAcademicSchoolId) continue;

                let existingBranch = existingBranchesByOrgNode.get(node.id) as any;
                if (!existingBranch) {
                    const branch = await tx.branch.create({
                        data: { name: node.name, schoolId: parentAcademicSchoolId, orgNodeId: node.id }
                    });
                    added++;
                    
                    // PERFORMANCE: Use in-memory map instead of findFirst query
                    const parentProg = schoolIdToProgram.get(parentAcademicSchoolId) as any;
                    const duration = parentProg?.durationYears || 4;
                    
                    const semesters = Array.from({ length: duration * 2 }, (_, i) => ({
                        semesterNumber: i + 1,
                        branchId: (branch as any).id
                    }));
                    await tx.semester.createMany({ data: semesters });
                } else if ((existingBranch as any).name !== node.name || (existingBranch as any).schoolId !== parentAcademicSchoolId) {
                    await tx.branch.update({
                        where: { id: (existingBranch as any).id },
                        data: { name: node.name, schoolId: parentAcademicSchoolId }
                    });
                    updated++;
                }
            }

            // Archive orphan branches
            const orphanBranchIds = Array.from(existingBranchesByOrgNode.values())
                .filter((b: any) => b.orgNodeId && !activeOrgNodeIds.has(b.orgNodeId))
                .map((b: any) => b.id);
            if (orphanBranchIds.length > 0) {
                await tx.branch.updateMany({ where: { id: { in: orphanBranchIds } }, data: { isDeleted: true } });
                deletedCount += orphanBranchIds.length;
            }

            return { added, updated, deleted: deletedCount };
        }, { timeout: 60000 }); // PERFORMANCE: 60s timeout for complex hierarchies

        // Audit Log
        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE',
                    entity: 'AcademicVersion',
                    entityId: id as string,
                    metadata: { message: 'In-memory sync complete', results: syncResult }
                }
            });
        }

        res.status(200).json({ message: 'Synchronization complete.', ...syncResult });
    } catch (error: any) {
        console.error('Core Transaction Failure:', error);
        res.status(500).json({ error: 'Sync Protocol Failure: ' + (error.message || 'Unknown matrix error') });
    }
};
