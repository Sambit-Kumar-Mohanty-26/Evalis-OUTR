import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ error: 'Tenant context missing.' });
            return;
        }

        // Fetch logs for this tenant's users
        const logs = await db.auditLog.findMany({
            where: {
                user: {
                    tenantId
                }
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        role: true,
                        email: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 100 // Limit for initial dashboard view
        });

        res.status(200).json(logs);
    } catch (error) {
        console.error('Audit Log Fetch Error:', error);
        res.status(500).json({ error: 'Failed to retrieve compliance records.' });
    }
};
