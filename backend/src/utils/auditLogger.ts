import { db } from '../config/db';
import { AuditAction } from '@prisma/client';

export const createAuditLog = async (
    userId: string,
    action: AuditAction,
    entity: string,
    entityId: string,
    metadata?: any,
    ipAddress?: string
) => {
    // Normalize localhost
    const normalizedIp = (ipAddress === '::1' || ipAddress === '127.0.0.1') ? '127.0.0.1' : ipAddress;
    
    try {
        await db.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
                ipAddress: normalizedIp
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We don't want to throw here as it might break the main operation
    }
};
