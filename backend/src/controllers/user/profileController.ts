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

        // 1. Password Change (Mandatory if onboardingRequired is true)
        if (user.onboardingRequired) {
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                res.status(400).json({ error: 'Current password does not match default credentials.' });
                return;
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 12);
            
            // 2. Profile Details
            const updateData: any = {
                passwordHash: newPasswordHash,
                phoneNumber: phoneNumber || user.phoneNumber,
                onboardingRequired: false,
            };

            // Academic Linkage
            if (schoolId || branchId) {
                const nodeIds: string[] = [];
                
                // For HOS/ADVISOR/TEACHER, we manage nodes
                if (user.role === 'HEAD_OF_SCHOOL' && schoolId) {
                    const schoolNode = await db.organizationNode.findFirst({
                        where: { 
                            tenantId: user.tenantId,
                            name: { contains: schoolId, mode: 'insensitive' },
                            type: 'SCHOOL'
                        }
                    });
                    if (schoolNode) nodeIds.push(schoolNode.id);
                } else if (branchId) {
                    const branch = await db.branch.findUnique({
                        where: { id: branchId },
                        include: { orgNode: true }
                    });
                    if (branch?.orgNodeId) nodeIds.push(branch.orgNodeId);
                }

                if (nodeIds.length > 0) {
                    updateData.managedNodes = {
                        connect: nodeIds.map(id => ({ id }))
                    };
                }

                // If Advisor, set metadata
                if (user.role === 'ADVISOR' && branchId) {
                    const branch = await db.branch.findUnique({ where: { id: branchId } });
                    if (branch?.orgNodeId) {
                        updateData.metadata = { primaryAdvisorNodeId: branch.orgNodeId };
                    }
                }
            }

            // Student specific
            if (user.role === 'STUDENT') {
                updateData.rollNumber = rollNumber || user.rollNumber;
                updateData.currentSemester = parseInt(currentSemester) || 1;
                
                // For students, we usually link to a Batch. 
                // But the user said "same for student like his regd. no, branch and school"
                // We'll try to find the batch for this branch if provided
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

            res.status(200).json({ message: 'Profile synthesized successfully.' });
        } else {
            res.status(400).json({ error: 'Onboarding already completed.' });
        }
    } catch (error) {
        console.error('Setup Profile Error:', error);
        res.status(500).json({ error: 'Failed to synchronize profile details.' });
    }
};
