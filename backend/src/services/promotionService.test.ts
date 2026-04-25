import { promoteBatchSemester } from './promotionService';
import { db } from '../config/db';

// Mock Prisma
jest.mock('../config/db', () => ({
    db: {
        batch: {
            findUnique: jest.fn(),
            update: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        batchSemester: {
            findUnique: jest.fn(),
            update: jest.fn(),
            createMany: jest.fn(),
        },
        studentResult: {
            count: jest.fn(),
        },
        studentBacklog: {
            count: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
        promotionLog: {
            create: jest.fn(),
        },
        academicYear: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    }
}));

describe('Promotion Logic Verification', () => {
    const mockBatchId = 'batch-123';
    const mockAdminId = 'admin-456';
    const mockStudent = {
        id: 'std-1',
        fullName: 'Test Student',
        rollNumber: 'ROLL001',
        currentSemester: 1,
        cgpa: 8.5
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── SCENARIO 1: DATE VALIDATION ───
    it('should block promotion if semester end date has not passed', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        (db.batch.findUnique as jest.Mock).mockResolvedValue({
            id: mockBatchId,
            currentSemester: 1,
            totalSemesters: 8,
            students: [mockStudent],
            branch: { school: { program: { version: { tenantId: 't1' } } } },
            semesterTimelines: []
        });

        (db.batchSemester.findUnique as jest.Mock).mockResolvedValue({
            id: 'sem-1',
            endDate: futureDate
        });

        const result = await promoteBatchSemester(mockBatchId, mockAdminId);
        expect(result.errors[0]).toContain('has not reached its end date');
        expect(result.promoted).toBe(0);
    });

    // ─── SCENARIO 2: ODD -> EVEN (CASE 1) ───
    it('should promote all students in Odd->Even transition regardless of backlogs', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        (db.batch.findUnique as jest.Mock).mockResolvedValue({
            id: mockBatchId,
            currentSemester: 1, // Odd
            totalSemesters: 8,
            students: [mockStudent],
            branch: { school: { program: { version: { tenantId: 't1' } } } },
            semesterTimelines: []
        });

        (db.batchSemester.findUnique as jest.Mock).mockResolvedValue({ id: 'sem-1', endDate: pastDate });
        (db.studentResult.count as jest.Mock).mockResolvedValue(0); // All published
        (db.studentBacklog.count as jest.Mock).mockResolvedValue(5); // Student has 5 backlogs

        const result = await promoteBatchSemester(mockBatchId, mockAdminId);
        
        expect(result.promotedWithBacklog).toBe(1);
        expect(result.details[0].remarks).toContain('Simple Transition');
        expect(db.user.update).toHaveBeenCalledWith({
            where: { id: mockStudent.id },
            data: { currentSemester: 2 }
        });
    });

    // ─── SCENARIO 3: EVEN -> ODD (CASE 2 - SUCCESS) ───
    it('should promote in Even->Odd if CGPA is above threshold', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        (db.batch.findUnique as jest.Mock).mockResolvedValue({
            id: mockBatchId,
            currentSemester: 2, // Even
            totalSemesters: 8,
            students: [{ ...mockStudent, cgpa: 7.0 }],
            branch: { school: { program: { version: { tenantId: 't1' } } } },
            semesterTimelines: []
        });

        (db.batchSemester.findUnique as jest.Mock).mockResolvedValue({ id: 'sem-2', endDate: pastDate });
        (db.studentResult.count as jest.Mock).mockResolvedValue(0);
        (db.studentBacklog.count as jest.Mock).mockResolvedValue(0);

        const result = await promoteBatchSemester(mockBatchId, mockAdminId);
        
        expect(result.promoted).toBe(1);
        expect(result.details[0].remarks).toContain('Critical Checkpoint Passed');
    });

    // ─── SCENARIO 4: EVEN -> ODD (CASE 2 - YEAR BACK) ───
    it('should trigger Year Back if CGPA is below threshold in Even->Odd transition', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        (db.batch.findUnique as jest.Mock).mockResolvedValue({
            id: mockBatchId,
            currentSemester: 2, // Even
            startYear: 2023,
            branchId: 'br-1',
            totalSemesters: 8,
            students: [{ ...mockStudent, cgpa: 3.0 }], // Below 4.5 threshold for Year 1
            branch: { branchId: 'br-1', school: { program: { durationYears: 4, version: { tenantId: 't1' } } } },
            semesterTimelines: []
        });

        (db.batchSemester.findUnique as jest.Mock).mockResolvedValue({ id: 'sem-2', endDate: pastDate });
        (db.studentResult.count as jest.Mock).mockResolvedValue(0);
        (db.studentBacklog.count as jest.Mock).mockResolvedValue(0);
        
        // Mock next batch creation
        (db.batch.findFirst as jest.Mock).mockResolvedValue({ id: 'next-batch-id' });

        const result = await promoteBatchSemester(mockBatchId, mockAdminId);
        
        expect(result.notPromoted).toBe(1);
        expect(result.movedToNextCohort).toBe(1);
        expect(result.details[0].remarks).toContain('Year back');
        expect(db.user.update).toHaveBeenCalledWith({
            where: { id: mockStudent.id },
            data: { batchId: 'next-batch-id', currentSemester: 1 }
        });
    });
});
