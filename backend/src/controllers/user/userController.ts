import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';
import bcrypt from 'bcrypt';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { createAuditLog } from '../../utils/auditLogger';
import { AuditAction } from '@prisma/client';

const DEFAULT_PASSWORD = 'Evalis@2026';

const getSingleParam = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
};

// ─── GET SINGLE USER ─────────────────────────────────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = getSingleParam(req.params.id);
        const tenantId = req.user!.tenantId;

        if (!id) {
            res.status(400).json({ error: 'User id is required.' });
            return;
        }

        const user = await db.user.findUnique({
            where: { id, tenantId, isDeleted: false },
            include: {
                managedNodes: { select: { id: true, name: true, type: true, level: true } },
                taughtSubjects: { select: { id: true, name: true, code: true } },
                batch: {
                    include: {
                        branch: {
                            include: {
                                school: {
                                    include: { program: true }
                                }
                            }
                        }
                    }
                },
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get User By Id Error:', error);
        res.status(500).json({ error: 'Failed to retrieve user details.' });
    }
};

// ─── GET USERS (Paginated + Search + Filters) ────────────────────────────────
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const {
            role, search, schoolId, branchId, batchId,
            status, page = '1', limit = '20'
        } = req.query as Record<string, string>;

        const where: any = {
            tenantId,
            isDeleted: false,
        };

        if (role && role !== 'all') where.role = role;
        if (status && status !== 'all') where.status = status;

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { rollNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (batchId) where.batchId = batchId;

        if (branchId) {
            const branch = await db.branch.findUnique({ where: { id: branchId }, select: { orgNodeId: true } });
            if (branch?.orgNodeId) {
                where.managedNodes = { some: { id: branch.orgNodeId } };
            } else {
                // Fallback for safety or if not mapped
                where.managedNodes = { some: { id: branchId } };
            }
        } else if (schoolId) {
            const school = await db.academicSchool.findUnique({ where: { id: schoolId }, select: { orgNodeId: true } });
            if (school?.orgNodeId) {
                where.managedNodes = { some: { id: school.orgNodeId } };
            } else {
                where.managedNodes = { some: { id: schoolId } };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                include: {
                    managedNodes: { select: { id: true, name: true, type: true, level: true } },
                    taughtSubjects: { select: { id: true, name: true, code: true } },
                    batch: {
                        include: {
                            branch: {
                                include: {
                                    school: {
                                        include: { program: true }
                                    }
                                }
                            }
                        }
                    },
                },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            db.user.count({ where }),
        ]);

        res.json({
            users,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / take)
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
};

// ─── GET METADATA (Dropdowns for Schools, Branches, Batches, etc.) ───────────
export const getUserMetadata = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;

        const [orgNodes, programs, schools, branches, batches, subjects] = await Promise.all([
            db.organizationNode.findMany({
                where: { tenantId, isDeleted: false },
                select: { id: true, name: true, type: true, level: true, parentId: true },
                orderBy: { level: 'asc' }
            }),
            db.program.findMany({
                where: { isDeleted: false, version: { tenantId, isCurrent: true } },
                select: { id: true, name: true, durationYears: true }
            }),
            db.academicSchool.findMany({
                where: { isDeleted: false, program: { version: { tenantId, isCurrent: true } } },
                select: { id: true, name: true, programId: true, orgNodeId: true }
            }),
            db.branch.findMany({
                where: { isDeleted: false, school: { program: { version: { tenantId, isCurrent: true } } } },
                select: { id: true, name: true, schoolId: true, orgNodeId: true }
            }),
            db.batch.findMany({
                where: { isDeleted: false, branch: { school: { program: { version: { tenantId, isCurrent: true } } } } },
                select: { id: true, name: true, branchId: true, academicYearId: true },
                orderBy: { createdAt: 'desc' }
            }),
            db.subject.findMany({
                where: { isDeleted: false, semester: { branch: { school: { program: { version: { tenantId, isCurrent: true } } } } } },
                select: { id: true, name: true, code: true, semesterId: true },
                orderBy: { name: 'asc' }
            })
        ]);

        res.json({ orgNodes, programs, schools, branches, batches, subjects });
    } catch (error) {
        console.error('Get Metadata Error:', error);
        res.status(500).json({ error: 'Failed to retrieve metadata.' });
    }
};

// ─── CREATE USER (Manual) ────────────────────────────────────────────────────
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const userId = req.user!.userId;
        const {
            fullName, email, phoneNumber, password,
            role, rollNumber, batchId, currentSemester,
            managedNodeIds, subjectIds, metadata
        } = req.body;

        if (!fullName || !email || !role) {
            res.status(400).json({ error: 'fullName, email, and role are required.' });
            return;
        }

        // Check duplicate email
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: `Email ${email} already exists in the system.` });
            return;
        }

        const passwordHash = await bcrypt.hash(password || DEFAULT_PASSWORD, 12);

        const user = await db.user.create({
            data: {
                fullName,
                email,
                phoneNumber: phoneNumber || null,
                passwordHash,
                role,
                tenantId,
                rollNumber: rollNumber || null,
                batchId: batchId || null,
                currentSemester: currentSemester ? parseInt(currentSemester) : null,
                status: 'ACTIVE',
                managedNodes: managedNodeIds?.length
                    ? { connect: managedNodeIds.map((id: string) => ({ id })) }
                    : undefined,
                taughtSubjects: subjectIds?.length
                    ? { connect: subjectIds.map((id: string) => ({ id })) }
                    : undefined,
                metadata: metadata || undefined,
            } as any,
            include: {
                managedNodes: { select: { id: true, name: true, type: true } },
                taughtSubjects: { select: { id: true, name: true, code: true } },
                batch: true,
            }
        });

        // Audit Log
        await createAuditLog(
            userId,
            'CREATE',
            'User',
            user.id,
            { fullName, email, role, createdBy: userId },
            req.ip
        );

        res.status(201).json(user);
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({
            error: 'Failed to create user.',
            details: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
        });
    }
};

// ─── UPDATE USER ─────────────────────────────────────────────────────────────
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = getSingleParam(req.params.id);
        const adminUserId = req.user!.userId;
        const {
            fullName, email, phoneNumber, role, status,
            rollNumber, batchId, currentSemester,
            managedNodeIds, subjectIds, metadata
        } = req.body;

        if (!id) {
            res.status(400).json({ error: 'User id is required.' });
            return;
        }

        // Check if email is being updated and is unique
        if (email) {
            const existing = await db.user.findFirst({
                where: { 
                    email, 
                    id: { not: id },
                    isDeleted: false 
                }
            });
            if (existing) {
                res.status(409).json({ error: `Email ${email} is already taken by another user.` });
                return;
            }
        }

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;
        if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
        if (batchId !== undefined) updateData.batchId = batchId || null;
        if (currentSemester !== undefined) updateData.currentSemester = currentSemester ? parseInt(currentSemester) : null;
        if (metadata !== undefined) updateData.metadata = metadata;

        if (managedNodeIds !== undefined) {
            updateData.managedNodes = { set: managedNodeIds.map((id: string) => ({ id })) };
        }
        if (subjectIds !== undefined) {
            updateData.taughtSubjects = { set: subjectIds.map((id: string) => ({ id })) };
        }

        const user = await db.user.update({
            where: { id },
            data: updateData,
            include: {
                managedNodes: { select: { id: true, name: true, type: true } },
                taughtSubjects: { select: { id: true, name: true, code: true } },
                batch: true,
            }
        });

        await createAuditLog(
            adminUserId,
            'UPDATE',
            'User',
            id,
            updateData,
            req.ip
        );

        res.json(user);
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ 
            error: 'Failed to update user.', 
            details: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
        });
    }
};

// ─── DELETE USER (Soft) ──────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = getSingleParam(req.params.id);
        const adminUserId = req.user!.userId;

        if (!id) {
            res.status(400).json({ error: 'User id is required.' });
            return;
        }

        await db.user.update({
            where: { id },
            data: { isDeleted: true, status: 'INACTIVE' }
        });

        await createAuditLog(
            adminUserId,
            'DELETE',
            'User',
            id,
            { deletedBy: adminUserId, softDelete: true },
            req.ip
        );

        res.json({ message: 'User deactivated successfully.' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
};

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = getSingleParam(req.params.id);
        const adminUserId = req.user!.userId;
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

        if (!id) {
            res.status(400).json({ error: 'User id is required.' });
            return;
        }

        await db.user.update({
            where: { id },
            data: { passwordHash }
        });

        await createAuditLog(
            adminUserId,
            'UPDATE',
            'User',
            id,
            { action: 'PASSWORD_RESET', resetBy: adminUserId },
            req.ip
        );

        res.json({ message: 'Password reset to default.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
};

// ─── ASSIGN / REMOVE ADMIN ROLE ──────────────────────────────────────────────
export const assignAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = getSingleParam(req.params.id);
        const nodeId = getSingleParam(req.body.nodeId);
        const adminUserId = req.user!.userId;

        if (!id) {
            res.status(400).json({ error: 'User id is required.' });
            return;
        }

        if (!nodeId) {
            res.status(400).json({ error: 'nodeId is required.' });
            return;
        }

        const user = await db.user.update({
            where: { id },
            data: {
                managedNodes: { connect: { id: nodeId } }
            },
            include: {
                managedNodes: { select: { id: true, name: true, type: true, level: true } }
            }
        });

        await createAuditLog(
            adminUserId,
            'UPDATE',
            'User',
            id,
            { action: 'ASSIGN_ADMIN', nodeId, assignedBy: adminUserId },
            req.ip
        );

        res.json(user);
    } catch (error) {
        console.error('Assign Admin Error:', error);
        res.status(500).json({ error: 'Failed to assign admin role.' });
    }
};

export const removeAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = getSingleParam(req.params.id);
        const nodeId = getSingleParam(req.params.nodeId);
        const adminUserId = req.user!.userId;

        if (!id) {
            res.status(400).json({ error: 'User id is required.' });
            return;
        }

        if (!nodeId) {
            res.status(400).json({ error: 'nodeId is required.' });
            return;
        }

        const user = await db.user.update({
            where: { id },
            data: {
                managedNodes: { disconnect: { id: nodeId } }
            },
            include: {
                managedNodes: { select: { id: true, name: true, type: true, level: true } }
            }
        });

        await createAuditLog(
            adminUserId,
            'UPDATE',
            'User',
            id,
            { action: 'REMOVE_ADMIN', nodeId, removedBy: adminUserId },
            req.ip
        );

        res.json(user);
    } catch (error) {
        console.error('Remove Admin Error:', error);
        res.status(500).json({ error: 'Failed to remove admin role.' });
    }
};

// ─── BULK UPLOAD (CSV) ──────────────────────────────────────────────────────
export const bulkUploadUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const adminUserId = req.user!.userId;
        const file = (req as any).file;

        if (!file) {
            res.status(400).json({ error: 'CSV file is required.' });
            return;
        }

        const { role, batchId } = req.body;
        if (!role) {
            res.status(400).json({ error: 'Role context (TEACHER or STUDENT) is required.' });
            return;
        }

        const rows: any[] = [];
        const errors: string[] = [];

        // Parse CSV from buffer
        await new Promise<void>((resolve, reject) => {
            const stream = Readable.from(file.buffer.toString());
            stream
                .pipe(csv())
                .on('data', (row: any) => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        if (rows.length === 0) {
            res.status(400).json({ error: 'CSV file is empty.' });
            return;
        }

        // For Teacher context: lookup schools and branches (if needed)
        const schools = role === 'TEACHER' ? await db.academicSchool.findMany({
            where: { isDeleted: false, program: { version: { tenantId, isCurrent: true } } },
            select: { id: true, name: true, orgNodeId: true }
        }) : [];

        const branches = role === 'TEACHER' ? await db.branch.findMany({
            where: { isDeleted: false, school: { program: { version: { tenantId, isCurrent: true } } } },
            select: { id: true, name: true, orgNodeId: true, schoolId: true }
        }) : [];

        // For Student context: lookup deeply nested batches
        const studentBatches = role === 'STUDENT' ? await db.batch.findMany({
            where: { isDeleted: false, branch: { school: { program: { version: { tenantId, isCurrent: true } } } } },
            include: {
                branch: {
                    include: { school: { include: { program: true } } }
                }
            }
        }) : [];

        const studentBranches = role === 'STUDENT' ? await db.branch.findMany({
            where: { isDeleted: false, school: { program: { version: { tenantId, isCurrent: true } } } },
            include: { school: { include: { program: true } } }
        }) : [];

        const schoolMap = new Map(schools.map(s => [s.name.toLowerCase().trim(), s]));
        const branchMap = new Map(branches.map(b => [`${b.schoolId}_${b.name.toLowerCase().trim()}`, b]));
        
        const studentBatchMap = new Map();
        const studentBranchMap = new Map();
        if (role === 'STUDENT') {
            studentBatches.forEach((b: any) => {
                const pName = b.branch.school.program.name.toLowerCase().trim();
                const sName = b.branch.school.name.toLowerCase().trim();
                const brName = b.branch.name.toLowerCase().trim();
                const btName = b.name.toLowerCase().trim();
                studentBatchMap.set(`${pName}|${sName}|${brName}|${btName}`, b.id);
            });
            studentBranches.forEach((b: any) => {
                const pName = b.school.program.name.toLowerCase().trim();
                const sName = b.school.name.toLowerCase().trim();
                const brName = b.name.toLowerCase().trim();
                studentBranchMap.set(`${pName}|${sName}|${brName}`, b.id);
            });
        }

        // Create set of existing emails to prevent duplicates
        const existingEmails = await db.user.findMany({
            where: { email: { in: rows.map(r => r.email?.trim()).filter(Boolean) } },
            select: { email: true }
        });
        const existingEmailSet = new Set(existingEmails.map(u => u.email));

        const validRows: any[] = [];
        for (const [index, row] of rows.entries()) {
            const lineNum = index + 2; // +2 because CSV header is line 1
            const name = (row.fullName || row.Name || row.name || '').trim();
            const email = (row.email || row.Email || '').trim();
            const phone = (row.phoneNumber || row.Phone || row.phone || '').trim();

            if (!name) { errors.push(`Row ${lineNum}: Missing name`); continue; }
            if (!email) { errors.push(`Row ${lineNum}: Missing email`); continue; }
            if (existingEmailSet.has(email)) { errors.push(`Row ${lineNum}: Email ${email} already exists`); continue; }

            const parsed: any = { fullName: name, email, phoneNumber: phone || null, managedNodeIds: [] };

            if (role === 'STUDENT') {
                parsed.rollNumber = (row.rollNumber || row.Roll || row.roll || '').trim() || null;
                parsed.currentSemester = parseInt(row.semester || row.Semester || '0') || null;

                const programName = (row.program || row.Program || '').toLowerCase().trim();
                const schoolName = (row.school || row.School || '').toLowerCase().trim();
                const branchName = (row.branch || row.Branch || '').toLowerCase().trim();
                const batchName = (row.batch || row.Batch || '').toLowerCase().trim();

                const lookupKey = `${programName}|${schoolName}|${branchName}|${batchName}`;
                let matchedBatchId = studentBatchMap.get(lookupKey);

                if (!matchedBatchId) {
                    // Try dynamic generation if the branch exists
                    const branchLookupKey = `${programName}|${schoolName}|${branchName}`;
                    const matchedBranchId = studentBranchMap.get(branchLookupKey);

                    if (!matchedBranchId) {
                        errors.push(`Row ${lineNum}: Target branch '${row.branch}' (Program: ${row.program}, School: ${row.school}) not found in active academic version.`);
                        continue;
                    }

                    // Dynamically create a Batch
                    let acYear = await db.academicYear.findFirst({
                        where: { tenantId, isCurrent: true }
                    });
                    if (!acYear) {
                        acYear = await db.academicYear.create({
                            data: {
                                name: "Current Academic Year",
                                startDate: new Date(),
                                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                                isCurrent: true,
                                tenantId
                            }
                        });
                    }

                    const newBatch = await db.batch.create({
                        data: {
                            name: row.batch.trim() || 'Default Batch',
                            academicYearId: acYear.id,
                            branchId: matchedBranchId
                        }
                    });

                    matchedBatchId = newBatch.id;
                    studentBatchMap.set(lookupKey, matchedBatchId);
                }

                parsed.batchId = matchedBatchId;
            } else if (role === 'TEACHER') {
                const schoolName = (row.school || row.School || '').toLowerCase().trim();
                const deptsStr = (row.department || row.Department || '').trim();

                const matchedSchool = schoolName ? schoolMap.get(schoolName) : null;
                if (schoolName && !matchedSchool) {
                    errors.push(`Row ${lineNum}: School '${row.school}' not found in current Academic Blueprint.`);
                    continue;
                }

                if (matchedSchool && matchedSchool.orgNodeId) {
                    parsed.managedNodeIds.push(matchedSchool.orgNodeId);
                }

                if (deptsStr) {
                    const depts = deptsStr.split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean);
                    for (const dName of depts) {
                        const branchKey = matchedSchool ? `${matchedSchool.id}_${dName}` : null;
                        
                        let matchedBranch = branchKey ? branchMap.get(branchKey) : null;
                        
                        if (branchKey && !matchedBranch) {
                            errors.push(`Row ${lineNum}: Department '${dName}' not found in school '${row.school}'.`);
                            continue; 
                        }

                        if (matchedBranch && matchedBranch.orgNodeId) {
                            parsed.managedNodeIds.push(matchedBranch.orgNodeId);
                        }
                    }
                }
            }

            validRows.push(parsed);
            existingEmailSet.add(email); // Prevent duplicates within the CSV
        }

        // Create users — batch
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
        let created = 0;

        for (const row of validRows) {
            try {
                await db.user.create({
                    data: {
                        fullName: row.fullName,
                        email: row.email,
                        phoneNumber: row.phoneNumber,
                        passwordHash,
                        role,
                        tenantId,
                        rollNumber: row.rollNumber || null,
                        currentSemester: row.currentSemester || null,
                        batchId: row.batchId || null,
                        status: 'ACTIVE',
                        managedNodes: row.managedNodeIds?.length
                            ? { connect: row.managedNodeIds.map((id: string) => ({ id })) }
                            : undefined,
                    }
                });
                created++;
            } catch (err: any) {
                errors.push(`Failed to create ${row.email}: ${err.message}`);
            }
        }

        // Audit Log
        await createAuditLog(
            adminUserId,
            'CREATE',
            'User',
            'BULK',
            {
                action: 'BULK_UPLOAD',
                role,
                totalRows: rows.length,
                created,
                failed: rows.length - created,
                errors: errors.slice(0, 20)
            },
            req.ip
        );

        res.status(201).json({
            message: `Bulk upload complete. ${created}/${rows.length} users created.`,
            created,
            total: rows.length,
            failed: rows.length - created,
            errors: errors.slice(0, 50)
        });
    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ error: 'Bulk upload failed.', details: error instanceof Error ? error.message : String(error) });
    }
};
