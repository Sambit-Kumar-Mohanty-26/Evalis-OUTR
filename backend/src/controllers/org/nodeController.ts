import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

export const createNode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, type, parentId, durationYears } = req.body;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.userId;

        if (!tenantId || !userId) {
            res.status(401).json({ error: 'Auth context missing.' });
            return;
        }

        const node = await db.organizationNode.create({
            data: {
                name,
                type,
                parentId,
                tenantId,
                durationYears: durationYears ? parseInt(durationYears as any) : 4
            }
        });

        // Audit Log
        await db.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'OrganizationNode',
                entityId: node.id,
                metadata: node as any
            }
        });

        res.status(201).json(node);
    } catch (error) {
        console.error('Create Node Error:', error);
        res.status(500).json({ error: 'Failed to architecturalize node.' });
    }
};

export const getNodes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ error: 'Tenant context missing.' });
            return;
        }

        const nodes = await db.organizationNode.findMany({
            where: { tenantId, isDeleted: false },
            orderBy: { order: 'asc' }
        });

        res.status(200).json(nodes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve institutional tree.' });
    }
};

export const syncNodes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { nodes } = req.body;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.userId;

        if (!tenantId || !userId) {
            res.status(401).json({ error: 'Auth context missing.' });
            return;
        }

        const incomingIds = nodes.map((n: any) => n.id);
        console.log(`[SYNC] Tenant: ${tenantId} | Nodes Incoming: ${nodes.length} | IDs:`, incomingIds);

        await db.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Soft delete nodes not in the incoming structure
            await tx.organizationNode.updateMany({
                where: {
                    tenantId,
                    id: { notIn: incomingIds }
                },
                data: { isDeleted: true }
            });

            // 2. Upsert all nodes (create new ones, update existing)
            for (const node of nodes) {
                await tx.organizationNode.upsert({
                    where: { id: node.id },
                    update: {
                        name: node.name,
                        type: node.type,
                        level: node.level,
                        order: node.order,
                        parentId: node.parentId,
                        isCollapsed: node.collapsed || false,
                        durationYears: node.durationYears ? parseInt(node.durationYears as any) : 4,
                        isDeleted: false
                    },
                    create: {
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        level: node.level,
                        order: node.order,
                        parentId: node.parentId,
                        isCollapsed: node.collapsed || false,
                        durationYears: node.durationYears ? parseInt(node.durationYears as any) : 4,
                        tenantId
                    }
                });
            }

            // 3. Audit Log for the batch operation
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE',
                    entity: 'OrganizationHierarchy',
                    entityId: tenantId,
                    metadata: { nodeCount: nodes.length }
                }
            });
        }, { timeout: 20000 });

        res.status(200).json({ status: 'success', message: 'Hierarchy matrix synchronized.' });
    } catch (error) {
        console.error('Hierarchy Sync Error:', error);
        res.status(500).json({ error: 'Failed to synchronize institutional DNA.' });
    }
};

export const deleteNode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Dependency Check: Cannot delete if children exist or branches are linked
        const node = await db.organizationNode.findUnique({
            where: { id: id as string },
            include: { children: { where: { isDeleted: false } }, branches: { where: { isDeleted: false } } }
        });

        if (!node) {
            res.status(404).json({ error: 'Node not found.' });
            return;
        }

        if ((node as any).children.length > 0 || (node as any).branches.length > 0) {
            res.status(400).json({ error: 'Integrity constraint: Node has active dependencies.' });
            return;
        }

        await db.organizationNode.update({
            where: { id: id as string },
            data: { isDeleted: true }
        });

        // Audit Log
        if (userId) {
            await db.auditLog.create({
                data: {
                    userId,
                    action: 'DELETE',
                    entity: 'OrganizationNode',
                    entityId: id as string,
                    metadata: { name: node.name }
                }
            });
        }

        res.status(200).json({ message: 'Node archived successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Deletion protocol failed.' });
    }
};
