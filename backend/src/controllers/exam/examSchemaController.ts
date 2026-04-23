import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

const p = (v: string | string[] | undefined): string => Array.isArray(v) ? v[0] : (v || '');

// ─── LIST EXAM SCHEMAS ───────────────────────────────────────────────────────
export const getExamSchemas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;

        const schemas = await db.examSchema.findMany({
            where: { tenantId, isDeleted: false },
            include: {
                components: { orderBy: { order: 'asc' } },
                _count: { select: { subjects: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ schemas });
    } catch (error) {
        console.error('Get Exam Schemas Error:', error);
        res.status(500).json({ error: 'Failed to retrieve exam schemas.' });
    }
};

// ─── CREATE EXAM SCHEMA ─────────────────────────────────────────────────────
export const createExamSchema = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const adminUserId = req.user!.userId;
        const { name, type, totalMarks, components } = req.body;
        // components: [{ name, maxMarks, category, order }]

        if (!name || !components || !Array.isArray(components) || components.length === 0) {
            res.status(400).json({ error: 'name and at least one component are required.' });
            return;
        }

        // Validate component total = totalMarks
        const componentTotal = components.reduce((sum: number, c: any) => sum + (c.maxMarks || 0), 0);
        const expectedTotal = totalMarks || 100;

        if (componentTotal !== expectedTotal) {
            res.status(400).json({
                error: `Component marks total (${componentTotal}) must equal schema total (${expectedTotal}).`
            });
            return;
        }

        const schema = await db.examSchema.create({
            data: {
                name,
                type: type || 'THEORY',
                totalMarks: expectedTotal,
                tenantId,
                components: {
                    create: components.map((c: any, i: number) => ({
                        name: c.name,
                        maxMarks: c.maxMarks,
                        category: c.category || 'INTERNAL',
                        order: c.order ?? i,
                    }))
                }
            },
            include: { components: { orderBy: { order: 'asc' } } }
        });

        // Audit
        await db.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'CREATE',
                entity: 'ExamSchema',
                entityId: schema.id,
                metadata: { name: schema.name, type: schema.type, componentCount: components.length } as any
            }
        });

        res.status(201).json(schema);
    } catch (error) {
        console.error('Create Exam Schema Error:', error);
        res.status(500).json({ error: 'Failed to create exam schema.' });
    }
};

// ─── UPDATE EXAM SCHEMA ─────────────────────────────────────────────────────
export const updateExamSchema = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const { name, type, totalMarks, components } = req.body;

        // If components provided, validate total
        if (components && Array.isArray(components)) {
            const expectedTotal = totalMarks || 100;
            const componentTotal = components.reduce((sum: number, c: any) => sum + (c.maxMarks || 0), 0);
            if (componentTotal !== expectedTotal) {
                res.status(400).json({
                    error: `Component marks total (${componentTotal}) must equal schema total (${expectedTotal}).`
                });
                return;
            }

            // Delete old components and create new ones
            await db.examComponent.deleteMany({ where: { schemaId: id } });
            await db.examComponent.createMany({
                data: components.map((c: any, i: number) => ({
                    name: c.name,
                    maxMarks: c.maxMarks,
                    category: c.category || 'INTERNAL',
                    order: c.order ?? i,
                    schemaId: id,
                }))
            });
        }

        const schema = await db.examSchema.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(totalMarks && { totalMarks }),
            },
            include: { components: { orderBy: { order: 'asc' } } }
        });

        res.json(schema);
    } catch (error) {
        console.error('Update Exam Schema Error:', error);
        res.status(500).json({ error: 'Failed to update exam schema.' });
    }
};

// ─── DELETE EXAM SCHEMA ──────────────────────────────────────────────────────
export const deleteExamSchema = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        await db.examSchema.update({ where: { id }, data: { isDeleted: true } });
        res.json({ message: 'Exam schema deleted.' });
    } catch (error) {
        console.error('Delete Exam Schema Error:', error);
        res.status(500).json({ error: 'Failed to delete exam schema.' });
    }
};

// ─── MAP SCHEMA TO SUBJECTS ─────────────────────────────────────────────────
export const mapSchemaToSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = p(req.params.id);
        const { subjectIds } = req.body; // Array of subject IDs

        if (!subjectIds || !Array.isArray(subjectIds)) {
            res.status(400).json({ error: 'subjectIds array is required.' });
            return;
        }

        await db.subject.updateMany({
            where: { id: { in: subjectIds } },
            data: { examSchemaId: id }
        });

        res.json({ message: `Schema mapped to ${subjectIds.length} subject(s).` });
    } catch (error) {
        console.error('Map Schema Error:', error);
        res.status(500).json({ error: 'Failed to map schema.' });
    }
};
