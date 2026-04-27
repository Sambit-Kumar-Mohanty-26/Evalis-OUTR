import { Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

export const setupProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword, phoneNumber, schoolId, branchId, rollNumber, currentSemester } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Identity not found in session.' });
            return;
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        // 1. Password Change (Mandatory if onboardingRequired is true, optional otherwise)
        if (user.onboardingRequired && !currentPassword) {
            res.status(400).json({ error: 'Current password required for initial protocol.' });
            return;
        }

        if (currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                res.status(400).json({ error: 'Current password does not match system records.' });
                return;
            }
        }

        const updateData: any = {
            phoneNumber: phoneNumber || user.phoneNumber,
            onboardingRequired: false,
        };

        if (newPassword) {
            updateData.passwordHash = await bcrypt.hash(newPassword, 12);
        }

        // Academic Linkage
        if (schoolId || branchId) {
            const nodeIds: string[] = [];
            
            if (user.role === 'HEAD_OF_SCHOOL' && schoolId) {
                const school = await db.academicSchool.findUnique({ where: { id: schoolId } });
                if (school?.orgNodeId) nodeIds.push(school.orgNodeId);
            } else if (branchId) {
                const branch = await db.branch.findUnique({
                    where: { id: branchId },
                    include: { orgNode: true }
                });
                if (branch?.orgNodeId) nodeIds.push(branch.orgNodeId);
            }

            if (nodeIds.length > 0) {
                updateData.managedNodes = {
                    set: nodeIds.map(id => ({ id })) // Use SET to overwrite previous broken links
                };
            }
        }

        // Student specific
        if (user.role === 'STUDENT') {
            if (rollNumber) updateData.rollNumber = rollNumber;
            if (currentSemester) updateData.currentSemester = parseInt(currentSemester);
            
            if (branchId) {
                const batch = await db.batch.findFirst({
                    where: { branchId: branchId },
                    orderBy: { createdAt: 'desc' }
                });
                if (batch) updateData.batchId = batch.id;
            }
        }

        await db.user.update({
            where: { id: userId },
            data: updateData
        });

        res.status(200).json({ message: 'Profile synchronized successfully.' });
    } catch (error) {
        console.error('Setup Profile Error:', error);
        res.status(500).json({ error: 'Failed to synchronize profile details.' });
    }
};
