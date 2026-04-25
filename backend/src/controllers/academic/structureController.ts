import { Response } from 'express';
import { db } from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';

export const getAcademicStructure = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { versionId } = req.query;
        const tenantId = req.user?.tenantId;

        if (!versionId) {
            res.status(400).json({ error: 'Version context required.' });
            return;
        }

        const includeClause = {
            programs: {
                where: { isDeleted: false },
                include: {
                    schools: {
                        where: { isDeleted: false },
                        include: {
                            branches: {
                                where: { isDeleted: false },
                                include: {
                                    semesters: {
                                        include: {
                                            subjects: {
                                                where: { isDeleted: false },
                                                include: {
                                                    teacher: {
                                                        select: {
                                                            fullName: true,
                                                            role: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        let structure;
        if (versionId === 'current') {
            const activeVersions = await db.academicVersion.findMany({
                where: { tenantId, isCurrent: true, isDeleted: false },
                include: includeClause
            });
            
            if (activeVersions.length === 0) {
                res.status(404).json({ error: 'No active blueprint versions found.' });
                return;
            }

            // Merge all programs from all active versions
            structure = {
                id: 'active-aggregate',
                name: 'Active Blueprints',
                programs: activeVersions.flatMap((v: any) => v.programs || [])
            };
        } else {
            structure = await db.academicVersion.findUnique({
                where: { id: versionId as string },
                include: includeClause
            });
        }

        if (!structure) {
            res.status(404).json({ error: 'Blueprint structure not found.' });
            return;
        }

        res.status(200).json(structure);
    } catch (error) {
        console.error('Structure Fetch Error:', error);
        res.status(500).json({ error: 'Architectural context retrieval failure.' });
    }
};
