import { Request, Response } from 'express';
import { db } from '../../config/db';

export const getAcademicStructure = async (req: Request, res: Response): Promise<void> => {
    try {
        const { versionId } = req.query;
        if (!versionId) {
            res.status(400).json({ error: 'Version context required.' });
            return;
        }

        const structure = await db.academicVersion.findUnique({
            where: { id: versionId as string },
            include: {
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
            }
        });

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
