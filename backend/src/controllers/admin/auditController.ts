import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { db } from '../../config/db';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user!.tenantId;
        const { entity, action, search, page = '1', limit = '50' } = req.query as Record<string, string>;

        const where: any = {
            user: { tenantId },
        };

        if (entity && entity !== 'all') where.entity = entity;
        if (action && action !== 'all') where.action = action;
        
        if (search) {
            where.OR = [
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { entity: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [logs, total] = await Promise.all([
            db.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            fullName: true,
                            email: true,
                            role: true
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                skip,
                take
            }),
            db.auditLog.count({ where })
        ]);

        res.json({
            logs,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / take)
        });
    } catch (error) {
        console.error('Get Audit Logs Error:', error);
        res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
};
