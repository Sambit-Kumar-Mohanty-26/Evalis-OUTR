import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';
import { cache } from '../../services/cacheService';
import { getPassPercent, getFailPercent, getAvgCGPA, getBacklogPercent, getSchoolStats } from '../../services/analyticsService';

// Helper: get school orgNodeId from user metadata
const getHosSchoolOrgNodeId = (req: AuthRequest): string | null => {
    const meta = (req.user as any)?.metadata;
    if (meta && typeof meta === 'object' && meta.schoolOrgNodeId) return meta.schoolOrgNodeId;
    return null;
};

// ─── SCHOOL OVERVIEW ──────────────────────────────────────────────────────────
export const getHosOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        // Get the school this HOS manages from their managed nodes
        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true, name: true, type: true } } }
        });

        const schoolNode = hosUser?.managedNodes?.find(n => n.type.toUpperCase() === 'SCHOOL' || n.type.toUpperCase() === 'CUSTOM') || hosUser?.managedNodes?.[0];
        if (!schoolNode) {
            res.json({ 
                totalStudents: 0, totalBranches: 0, avgCGPA: 0, passPercent: 0, backlogPercent: 0, 
                schoolName: 'No School Assigned',
                hosName: hosUser?.fullName 
            });
            return;
        }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'overview');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const stats = await getSchoolStats(schoolNode.id, tenantId);
        if (!stats) {
            res.json({ totalStudents: 0, totalBranches: 0, avgCGPA: 0, passPercent: 0, backlogPercent: 0, schoolName: schoolNode.name });
            return;
        }

        cache.set(cacheKey, { ...stats, hosName: hosUser?.fullName });
        res.json({ ...stats, hosName: hosUser?.fullName });
    } catch (error) {
        console.error('HOS Overview Error:', error);
        res.status(500).json({ error: 'Failed to load school overview.' });
    }
};

// ─── BRANCH PERFORMANCE COMPARISON ───────────────────────────────────────────
export const getHosBranchPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true, type: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.find(n => n.type.toUpperCase() === 'SCHOOL') || hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ branches: [] }); return; }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'branches');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { 
                branches: { 
                    where: { isDeleted: false },
                    include: { batches: { where: { isDeleted: false } } }
                } 
            },
            orderBy: { createdAt: 'desc' } // Get most recent one if duplicates exist
        });
        if (!school) { res.json({ branches: [] }); return; }

        const branchStats = await Promise.all(school.branches.map(async (branch) => {
            const results = await db.studentResult.findMany({
                where: { student: { batch: { branchId: branch.id } }, isPublished: true },
                select: { status: true }
            });
            const students = await db.user.count({
                where: { batch: { branchId: branch.id }, role: 'STUDENT', isDeleted: false }
            });

            // Fetch Advisor
            const advisor = branch.advisorId ? await db.user.findUnique({
                where: { id: branch.advisorId },
                select: { id: true, fullName: true, email: true }
            }) : null;

            return {
                branchId: branch.id,
                branchName: branch.name,
                totalStudents: students,
                batches: branch.batches.map(b => b.name).join(', '),
                passPercent: getPassPercent(results),
                failPercent: getFailPercent(results),
                totalResults: results.length,
                advisor: advisor || null
            };
        }));

        const result = { branches: branchStats };
        cache.set(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('HOS Branch Performance Error:', error);
        res.status(500).json({ error: 'Failed to load branch performance.' });
    }
};

// ─── ASSIGN BRANCH ADVISOR ──────────────────────────────────────────────────
export const assignBranchAdvisor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { branchId, teacherId } = req.body;
        const tenantId = req.user!.tenantId;

        if (!branchId || !teacherId) {
            res.status(400).json({ error: 'Branch ID and Teacher ID are required.' });
            return;
        }

        // Verify the user is a teacher or advisor
        const teacher = await db.user.findUnique({
            where: { 
                id: teacherId, 
                tenantId, 
                role: { in: ['TEACHER', 'ADVISOR'] }, 
                isDeleted: false 
            }
        });

        if (!teacher) {
            res.status(404).json({ error: 'Teacher not found or invalid role.' });
            return;
        }

        // 1. Identify the current advisor to handle demotion if necessary
        const currentBranch = await db.branch.findUnique({
            where: { id: branchId },
            select: { advisorId: true, orgNodeId: true }
        });

        const oldAdvisorId = currentBranch?.advisorId;

        // 2. Perform role transitions and branch update in a transaction
        const result = await db.$transaction(async (tx) => {
            // Demote old advisor if they won't have any other branches
            if (oldAdvisorId && oldAdvisorId !== teacherId) {
                const otherBranchCount = await tx.branch.count({
                    where: { advisorId: oldAdvisorId, id: { not: branchId }, isDeleted: false }
                });
                
                if (otherBranchCount === 0) {
                    await tx.user.update({
                        where: { id: oldAdvisorId },
                        data: { role: 'TEACHER' }
                    });
                }
            }

            // Promote new advisor and update their managed nodes
            await tx.user.update({
                where: { id: teacherId },
                data: { 
                    role: 'ADVISOR',
                    managedNodes: currentBranch?.orgNodeId ? {
                        connect: { id: currentBranch.orgNodeId }
                    } : undefined
                }
            });

            // Update the branch assignment
            return await tx.branch.update({
                where: { id: branchId },
                data: { advisorId: teacherId },
                include: { advisor: { select: { id: true, fullName: true, role: true } } }
            });
        });

        // 3. Audit Log
        await db.auditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'UPDATE',
                entity: 'Branch',
                entityId: branchId,
                metadata: { 
                    action: 'ASSIGN_ADVISOR', 
                    newAdvisorId: teacherId, 
                    oldAdvisorId: oldAdvisorId,
                    newRole: 'ADVISOR'
                } as any
            }
        });

        // 4. Clear cache
        cache.invalidate(cache.key(tenantId, 'hos', req.user!.userId, 'branches'));

        res.json({ 
            message: 'Advisor assigned and roles updated successfully.', 
            branch: result 
        });
    } catch (error) {
        console.error('Assign Advisor Error:', error);
        res.status(500).json({ error: 'Failed to assign advisor.' });
    }
};

export const revokeBranchAdvisor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const branchId = req.params.branchId as string;
        const tenantId = req.user!.tenantId;

        if (!branchId) {
            res.status(400).json({ error: 'Branch ID is required.' });
            return;
        }

        const currentBranch = await db.branch.findUnique({
            where: { id: branchId },
            select: { advisorId: true, orgNodeId: true }
        });

        const oldAdvisorId = currentBranch?.advisorId;

        if (!oldAdvisorId) {
            res.status(400).json({ error: 'No advisor assigned to this branch.' });
            return;
        }

        const result = await db.$transaction(async (tx) => {
            // Check if the advisor manages other branches
            const otherBranchCount = await tx.branch.count({
                where: { advisorId: oldAdvisorId, id: { not: branchId }, isDeleted: false }
            });
            
            // Demote to TEACHER if no other branches, and remove the specific managed node connection
            await tx.user.update({
                where: { id: oldAdvisorId },
                data: { 
                    role: otherBranchCount === 0 ? 'TEACHER' : undefined,
                    managedNodes: currentBranch?.orgNodeId ? {
                        disconnect: { id: currentBranch.orgNodeId }
                    } : undefined
                }
            });

            // Remove advisor from branch
            return await tx.branch.update({
                where: { id: branchId },
                data: { advisorId: null }
            });
        });

        // Audit Log
        await db.auditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'UPDATE',
                entity: 'Branch',
                entityId: branchId,
                metadata: { 
                    action: 'REVOKE_ADVISOR', 
                    oldAdvisorId: oldAdvisorId
                } as any
            }
        });

        // Clear cache
        cache.invalidate(cache.key(tenantId, 'hos', req.user!.userId, 'branches'));

        res.json({ 
            message: 'Advisor access revoked successfully.', 
            branch: result 
        });
    } catch (error) {
        console.error('Revoke Advisor Error:', error);
        res.status(500).json({ error: 'Failed to revoke advisor.' });
    }
};


// ─── GET ELIGIBLE TEACHERS FOR SCHOOL ─────────────────────────────────────────
export const getSchoolTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true, type: true } } }
        });

        const schoolNode = hosUser?.managedNodes?.find(n => n.type.toUpperCase() === 'SCHOOL') || hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ teachers: [] }); return; }

        // Find all node IDs in this school's hierarchy (School itself + its branches)
        const schoolWithChildren = await db.organizationNode.findUnique({
            where: { id: schoolNode.id },
            include: { children: { select: { id: true } } }
        });

        const nodeIds = [schoolNode.id, ...(schoolWithChildren?.children.map(c => c.id) || [])];

        // Find teachers/advisors who:
        // 1. Manage nodes in this school's hierarchy
        // 2. OR have NO managed nodes yet (newly signed up and unassigned)
        const teachers = await db.user.findMany({
            where: {
                role: { in: ['TEACHER', 'ADVISOR'] },
                tenantId,
                isDeleted: false,
                OR: [
                    { managedNodes: { some: { id: { in: nodeIds } } } },
                    { managedNodes: { none: {} } }
                ]
            },
            select: { id: true, fullName: true, email: true }
        });

        res.json({ teachers });
    } catch (error) {
        console.error('Get School Teachers Error:', error);
        res.status(500).json({ error: 'Failed to load school teachers.' });
    }
};



// ─── SUBJECT DIFFICULTY ANALYSIS ─────────────────────────────────────────────
export const getHosSubjectAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ subjects: [] }); return; }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'subjects');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false }, include: { semesters: { include: { subjects: { where: { isDeleted: false } } } } } } }
        });
        if (!school) { res.json({ subjects: [] }); return; }

        const subjectIds = school.branches.flatMap(b =>
            b.semesters.flatMap(s => s.subjects.map(sub => sub.id))
        );

        if (subjectIds.length === 0) { res.json({ subjects: [] }); return; }

        const allResults = await db.studentResult.findMany({
            where: { subjectId: { in: subjectIds }, isPublished: true },
            include: { subject: { select: { id: true, name: true, code: true } } }
        });

        // Group by subject
        const subjectMap = new Map<string, { name: string; code: string; results: { status: string }[] }>();
        for (const r of allResults) {
            const key = r.subjectId;
            if (!subjectMap.has(key)) {
                subjectMap.set(key, { name: r.subject.name, code: r.subject.code, results: [] });
            }
            subjectMap.get(key)!.results.push({ status: r.status });
        }

        const subjects = Array.from(subjectMap.entries()).map(([id, data]) => ({
            subjectId: id,
            name: data.name,
            code: data.code,
            total: data.results.length,
            passPercent: getPassPercent(data.results),
            failPercent: getFailPercent(data.results),
            isHighRisk: getFailPercent(data.results) >= 40
        })).sort((a, b) => b.failPercent - a.failPercent);

        const result = { subjects };
        cache.set(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('HOS Subject Analysis Error:', error);
        res.status(500).json({ error: 'Failed to load subject analysis.' });
    }
};

// ─── ALERTS ──────────────────────────────────────────────────────────────────
export const getHosAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ alerts: [] }); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false }, include: { batches: { where: { isDeleted: false } } } } }
        });
        if (!school) { res.json({ alerts: [] }); return; }

        const batchIds = school.branches.flatMap(b => b.batches.map(bt => bt.id));
        const alerts: { type: string; message: string; severity: string }[] = [];

        // Draft exams (not activated)
        const draftExams = await db.examInstance.count({
            where: { batchId: { in: batchIds }, status: 'DRAFT', isDeleted: false }
        });
        if (draftExams > 0) {
            alerts.push({ type: 'DRAFT_EXAM', message: `${draftExams} exam(s) still in Draft — not yet activated`, severity: 'WARNING' });
        }

        // Locked but unpublished
        const lockedUnpublished = await db.examInstance.findMany({
            where: { batchId: { in: batchIds }, status: 'LOCKED', isDeleted: false },
            include: { _count: { select: { results: true } } }
        });
        const unpublishedCount = lockedUnpublished.filter(e => e._count.results === 0).length;
        if (unpublishedCount > 0) {
            alerts.push({ type: 'UNPUBLISHED_RESULTS', message: `${unpublishedCount} exam(s) locked but results not published`, severity: 'ERROR' });
        }

        // Active exams with no marks
        const activeExams = await db.examInstance.findMany({
            where: { batchId: { in: batchIds }, status: 'ACTIVE', isDeleted: false },
            include: { _count: { select: { marks: true } } }
        });
        const noMarksCount = activeExams.filter(e => e._count.marks === 0).length;
        if (noMarksCount > 0) {
            alerts.push({ type: 'NO_MARKS', message: `${noMarksCount} active exam(s) have no marks entered yet`, severity: 'WARNING' });
        }

        res.json({ alerts });
    } catch (error) {
        console.error('HOS Alerts Error:', error);
        res.status(500).json({ error: 'Failed to load alerts.' });
    }
};

// ─── BACKLOG HEATMAP ─────────────────────────────────────────────────────────
export const getHosBacklogHeatmap = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tenantId = req.user!.tenantId;

        const hosUser = await db.user.findUnique({
            where: { id: userId },
            include: { managedNodes: { select: { id: true } } }
        });
        const schoolNode = hosUser?.managedNodes?.[0];
        if (!schoolNode) { res.json({ heatmap: [] }); return; }

        const cacheKey = cache.key(tenantId, 'hos', userId, 'heatmap');
        const cached = cache.get(cacheKey);
        if (cached) { res.json(cached); return; }

        const school = await db.academicSchool.findFirst({
            where: { orgNodeId: schoolNode.id, isDeleted: false },
            include: { branches: { where: { isDeleted: false } } }
        });
        if (!school) { res.json({ heatmap: [] }); return; }

        const branchIds = school.branches.map(b => b.id);

        const backlogs = await db.studentBacklog.findMany({
            where: { student: { batch: { branchId: { in: branchIds } } }, status: 'ACTIVE' },
            include: {
                subject: { select: { name: true, code: true } }
            }
        });

        // Group by subject + semester
        const heatmapMap = new Map<string, { subjectName: string; code: string; semester: number; count: number }>();
        for (const bl of backlogs) {
            const key = `${bl.subjectId}-${bl.semesterNumber}`;
            if (!heatmapMap.has(key)) {
                heatmapMap.set(key, { subjectName: bl.subject.name, code: bl.subject.code, semester: bl.semesterNumber, count: 0 });
            }
            heatmapMap.get(key)!.count++;
        }

        const heatmap = Array.from(heatmapMap.values()).sort((a, b) => b.count - a.count);
        const result = { heatmap };
        cache.set(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error('HOS Backlog Heatmap Error:', error);
        res.status(500).json({ error: 'Failed to load backlog heatmap.' });
    }
};

// ─── BRANCH STUDENTS ──────────────────────────────────────────────────────────
export const getHosBranchStudents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const branchId = req.params.branchId as string;
        const tenantId = req.user!.tenantId;

        if (!branchId) {
            res.status(400).json({ error: 'Branch ID is required' });
            return;
        }

        const students = await db.user.findMany({
            where: { 
                batch: { branchId }, 
                role: 'STUDENT', 
                tenantId,
                isDeleted: false 
            },
            select: {
                id: true,
                fullName: true,
                rollNumber: true,
                cgpa: true,
                currentSemester: true,
                metadata: true,
                batch: { select: { name: true } },
                _count: {
                    select: { backlogs: { where: { status: 'ACTIVE' } } }
                }
            },
            orderBy: { fullName: 'asc' }
        });

        // Map and include SGPA if available in metadata
        const studentList = students.map((s: any) => ({
            id: s.id,
            fullName: s.fullName,
            rollNumber: s.rollNumber,
            cgpa: s.cgpa || 0,
            sgpa: (s.metadata as any)?.lastSemesterSGPA || 0,
            semester: s.currentSemester || 1,
            batchName: s.batch?.name || 'N/A',
            backlogs: s._count?.backlogs || 0
        }));


        res.json({ students: studentList });
    } catch (error) {
        console.error('HOS Branch Students Error:', error);
        res.status(500).json({ error: 'Failed to load branch students.' });
    }
};

// ─── STUDENT DETAILS (HOS View) ──────────────────────────────────────────────
export const getHosStudentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.params.studentId as string;
        const tenantId = req.user!.tenantId;

        const student = await db.user.findUnique({
            where: { id: studentId, tenantId, role: 'STUDENT' } as any,
            include: {
                batch: {
                    include: {
                        branch: { include: { school: true } }
                    }
                },
                results: {
                    where: { isPublished: true },
                    include: { subject: true },
                    orderBy: { createdAt: 'desc' }
                },
                backlogs: {
                    where: { status: 'ACTIVE' },
                    include: { subject: true }
                }
            }
        });

        if (!student) {
            res.status(404).json({ error: 'Student not found.' });
            return;
        }

        res.json(student);
    } catch (error) {
        console.error('HOS Student Details Error:', error);
        res.status(500).json({ error: 'Failed to load student details.' });
    }
};


