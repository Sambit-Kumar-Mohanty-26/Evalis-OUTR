import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const downloadInternalTemplate = async (batchName: string, schoolName: string, subjectName: string, semester: string, students: any[]) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('MID SEMESTER');

    // Default styles
    const borderAll = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
    };
    const centerAlign = { vertical: 'middle' as const, horizontal: 'center' as const };
    const boldFont = { bold: true };

    // --- ROW 1 to 4 ---
    ws.mergeCells('A1:C1');
    ws.getCell('A1').value = 'OUTR';
    ws.getCell('A1').font = boldFont;
    ws.getCell('A1').alignment = centerAlign;
    ws.getCell('A1').border = borderAll;

    ws.mergeCells('A2:C2');
    ws.getCell('A2').value = schoolName;
    ws.getCell('A2').font = boldFont;
    ws.getCell('A2').alignment = centerAlign;
    ws.getCell('A2').border = borderAll;

    ws.mergeCells('A3:C3');
    ws.getCell('A3').value = `Sub, ${subjectName} 2024-25`;
    ws.getCell('A3').font = boldFont;
    ws.getCell('A3').alignment = centerAlign;
    ws.getCell('A3').border = borderAll;

    ws.mergeCells('A4:C4');
    ws.getCell('A4').value = `Sem- ${semester}`;
    ws.getCell('A4').font = boldFont;
    ws.getCell('A4').alignment = centerAlign;
    ws.getCell('A4').border = borderAll;

    ws.getCell('D1').value = 'Attainment Lev';
    ws.getCell('D1').font = boldFont;
    ws.getCell('D1').alignment = centerAlign;
    ws.getCell('D1').border = borderAll;
    ws.mergeCells('E1:H1');
    ws.getCell('E1').value = 'Description';
    ws.getCell('E1').font = boldFont;
    ws.getCell('E1').alignment = centerAlign;
    ws.getCell('E1').border = borderAll;

    const attainmentData = [
        [1, '60% Students Scored more than 50%'],
        [2, '65% Students Scored more than 50%'],
        [3, '70% Students Scored more than 50%']
    ];

    attainmentData.forEach((data, index) => {
        const rowNum = index + 2;
        ws.getCell(`D${rowNum}`).value = data[0];
        ws.getCell(`D${rowNum}`).font = boldFont;
        ws.getCell(`D${rowNum}`).alignment = centerAlign;
        ws.getCell(`D${rowNum}`).border = borderAll;

        ws.mergeCells(`E${rowNum}:H${rowNum}`);
        ws.getCell(`E${rowNum}`).value = data[1];
        ws.getCell(`E${rowNum}`).font = boldFont;
        ws.getCell(`E${rowNum}`).border = borderAll;
    });

    // --- ROW 5 ---
    ws.mergeCells('E5:I5');
    ws.getCell('E5').value = 'all questions are compulsory';
    ws.getCell('E5').alignment = centerAlign;
    ws.getCell('E5').border = borderAll;

    ws.mergeCells('J5:O5');
    ws.getCell('J5').value = 'all question are compulsory';
    ws.getCell('J5').alignment = centerAlign;
    ws.getCell('J5').border = borderAll;

    // --- ROW 6 ---
    ws.mergeCells('A6:A8');
    ws.getCell('A6').value = 'Name';
    ws.getCell('A6').alignment = centerAlign;
    ws.getCell('A6').border = borderAll;

    ws.mergeCells('B6:B8');
    ws.getCell('B6').value = 'RegNO';
    ws.getCell('B6').alignment = centerAlign;
    ws.getCell('B6').border = borderAll;

    ws.mergeCells('C6:C8');
    ws.getCell('C6').value = 'SUBJECT CODE';
    ws.getCell('C6').alignment = centerAlign;
    ws.getCell('C6').border = borderAll;

    ws.getCell('D6').value = 'QNo';
    ws.getCell('D6').alignment = centerAlign;
    ws.getCell('D6').border = borderAll;

    const qNoCols = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    const qNoVals = ['1(a)', '1(b)', '1(c)', '1(d)', '1(e)', '2 (a)', '2 (b)', '2 (c)', '2 (d)', '2 (e)', '2 (f)'];
    qNoCols.forEach((col, idx) => {
        ws.getCell(`${col}6`).value = qNoVals[idx];
        ws.getCell(`${col}6`).alignment = centerAlign;
        ws.getCell(`${col}6`).border = borderAll;
    });

    ws.mergeCells('P6:T6');
    ws.getCell('P6').value = 'Mark Analysis';
    ws.getCell('P6').alignment = centerAlign;
    ws.getCell('P6').border = borderAll;

    // --- ROW 7 ---
    ws.getCell('D7').value = 'CO';
    ws.getCell('D7').alignment = centerAlign;
    ws.getCell('D7').border = borderAll;

    const coData = [
        { col: 'E', val: 'CO1', color: 'FFFFFF00' },
        { col: 'F', val: 'CO2', color: 'FFFFFF00' },
        { col: 'G', val: 'CO2', color: 'FFFFFF00' },
        { col: 'H', val: 'CO1', color: 'FFFCE4D6' },
        { col: 'I', val: 'CO2', color: 'FFFFFF00' },
        { col: 'J', val: 'CO2', color: 'FFFFFF00' },
        { col: 'K', val: 'CO2', color: 'FFFCE4D6' },
        { col: 'L', val: 'CO1', color: 'FFFCE4D6' },
        { col: 'M', val: 'CO3', color: 'FFFFFF00' },
        { col: 'N', val: 'CO3', color: 'FFFCE4D6' },
        { col: 'O', val: 'CO3', color: 'FFFCE4D6' },
    ];
    coData.forEach(c => {
        ws.getCell(`${c.col}7`).value = c.val;
        ws.getCell(`${c.col}7`).alignment = centerAlign;
        ws.getCell(`${c.col}7`).border = borderAll;
        ws.getCell(`${c.col}7`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.color } };
        ws.getCell(`${c.col}7`).font = boldFont;
    });

    const markAnalysisCOs = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
    const pTotTCols = ['P', 'Q', 'R', 'S', 'T'];
    pTotTCols.forEach((col, idx) => {
        ws.getCell(`${col}7`).value = markAnalysisCOs[idx];
        ws.getCell(`${col}7`).alignment = centerAlign;
        ws.getCell(`${col}7`).border = borderAll;
        ws.getCell(`${col}7`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9BC2E6' } }; // Light blue
        ws.getCell(`${col}7`).font = boldFont;
    });

    ws.getCell('U7').value = 'Total';
    ws.getCell('U7').alignment = centerAlign;
    ws.getCell('U7').border = borderAll;
    ws.getCell('U7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Light green

    // --- ROW 8 ---
    ws.getCell('D8').value = 'Mark (20)';
    ws.getCell('D8').alignment = centerAlign;
    ws.getCell('D8').border = borderAll;
    ws.getCell('D8').font = boldFont;

    const marksData = [1, 1, 1, 1, 1, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5];
    qNoCols.forEach((col, idx) => {
        ws.getCell(`${col}8`).value = marksData[idx];
        ws.getCell(`${col}8`).alignment = centerAlign;
        ws.getCell(`${col}8`).border = borderAll;
        ws.getCell(`${col}8`).font = boldFont;
    });

    const maxCOData = [4.5, 8, 7.5, 0, 0];
    pTotTCols.forEach((col, idx) => {
        ws.getCell(`${col}8`).value = maxCOData[idx];
        ws.getCell(`${col}8`).alignment = centerAlign;
        ws.getCell(`${col}8`).border = borderAll;
        ws.getCell(`${col}8`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
        ws.getCell(`${col}8`).font = boldFont;
    });

    ws.getCell('U8').value = 20;
    ws.getCell('U8').alignment = centerAlign;
    ws.getCell('U8').border = borderAll;
    ws.getCell('U8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    ws.getCell('U8').font = boldFont;

    // --- STUDENTS DATA ---
    students.forEach((s, idx) => {
        const rowNum = 9 + idx;
        ws.getCell(`A${rowNum}`).value = s.fullName;
        ws.getCell(`B${rowNum}`).value = s.rollNumber;
        ws.getCell(`C${rowNum}`).value = subjectName;

        ['A', 'B', 'C', 'D'].forEach(c => {
            ws.getCell(`${c}${rowNum}`).border = borderAll;
            ws.getCell(`${c}${rowNum}`).alignment = centerAlign;
        });

        qNoCols.forEach(col => {
            ws.getCell(`${col}${rowNum}`).border = borderAll;
            ws.getCell(`${col}${rowNum}`).alignment = centerAlign;
        });

        pTotTCols.forEach(col => {
            ws.getCell(`${col}${rowNum}`).border = borderAll;
            ws.getCell(`${col}${rowNum}`).alignment = centerAlign;
            ws.getCell(`${col}${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
        });

        ws.getCell(`U${rowNum}`).border = borderAll;
        ws.getCell(`U${rowNum}`).alignment = centerAlign;
        ws.getCell(`U${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    });

    // --- HELPER FUNCTION FOR OTHER SHEETS ---
    const addStandardSheet = (sheetName: string, marksHeader: string, hasCOs: boolean, maxMarks: number, coData: number[] = []) => {
        const wsTab = wb.addWorksheet(sheetName);

        // --- ROW 1 to 4 ---
        wsTab.mergeCells('B1:D1');
        wsTab.getCell('B1').value = 'OUTR';
        wsTab.getCell('B1').font = boldFont;
        wsTab.getCell('B1').alignment = centerAlign;
        wsTab.getCell('B1').border = borderAll;

        wsTab.mergeCells('B2:D2');
        wsTab.getCell('B2').value = schoolName;
        wsTab.getCell('B2').font = boldFont;
        wsTab.getCell('B2').alignment = centerAlign;
        wsTab.getCell('B2').border = borderAll;

        wsTab.mergeCells('B3:D3');
        wsTab.getCell('B3').value = `Sub, ${subjectName} 2024-25`;
        wsTab.getCell('B3').font = boldFont;
        wsTab.getCell('B3').alignment = centerAlign;
        wsTab.getCell('B3').border = borderAll;

        wsTab.mergeCells('B4:D4');
        wsTab.getCell('B4').value = `Sem- ${semester}`;
        wsTab.getCell('B4').font = boldFont;
        wsTab.getCell('B4').alignment = centerAlign;
        wsTab.getCell('B4').border = borderAll;

        wsTab.getCell('E1').value = 'Attainment Level';
        wsTab.getCell('E1').font = boldFont;
        wsTab.getCell('E1').alignment = centerAlign;
        wsTab.getCell('E1').border = borderAll;
        wsTab.mergeCells('F1:H1');
        wsTab.getCell('F1').value = 'Description';
        wsTab.getCell('F1').font = boldFont;
        wsTab.getCell('F1').alignment = centerAlign;
        wsTab.getCell('F1').border = borderAll;

        attainmentData.forEach((data, index) => {
            const rowNum = index + 2;
            wsTab.getCell(`E${rowNum}`).value = data[0];
            wsTab.getCell(`E${rowNum}`).font = boldFont;
            wsTab.getCell(`E${rowNum}`).alignment = centerAlign;
            wsTab.getCell(`E${rowNum}`).border = borderAll;

            wsTab.mergeCells(`F${rowNum}:H${rowNum}`);
            wsTab.getCell(`F${rowNum}`).value = data[1];
            wsTab.getCell(`F${rowNum}`).font = boldFont;
            wsTab.getCell(`F${rowNum}`).border = borderAll;
        });

        // --- ROW 7 ---
        if (hasCOs) {
            wsTab.mergeCells('F7:J7');
            wsTab.getCell('F7').value = sheetName;
            wsTab.getCell('F7').font = boldFont;
            wsTab.getCell('F7').alignment = centerAlign;
            wsTab.getCell('F7').border = borderAll;
        }

        // --- ROW 8 (Headers) ---
        const headers = [
            { col: 'A', val: 'Sl. No.' },
            { col: 'B', val: 'Name of the Student' },
            { col: 'C', val: 'Regd. No.' },
            { col: 'D', val: 'Subject Code' },
            { col: 'E', val: marksHeader }
        ];

        headers.forEach(h => {
            wsTab.getCell(`${h.col}8`).value = h.val;
            wsTab.getCell(`${h.col}8`).font = boldFont;
            wsTab.getCell(`${h.col}8`).alignment = centerAlign;
            wsTab.getCell(`${h.col}8`).border = borderAll;
        });

        if (hasCOs) {
            const coHeaders = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
            const coCols = ['F', 'G', 'H', 'I', 'J'];
            coHeaders.forEach((val, idx) => {
                wsTab.getCell(`${coCols[idx]}8`).value = val;
                wsTab.getCell(`${coCols[idx]}8`).font = boldFont;
                wsTab.getCell(`${coCols[idx]}8`).alignment = centerAlign;
                wsTab.getCell(`${coCols[idx]}8`).border = borderAll;
            });

            // ROW 9 (CO Max Marks)
            coData.forEach((val, idx) => {
                wsTab.getCell(`${coCols[idx]}9`).value = val;
                wsTab.getCell(`${coCols[idx]}9`).font = boldFont;
                wsTab.getCell(`${coCols[idx]}9`).alignment = centerAlign;
                wsTab.getCell(`${coCols[idx]}9`).border = borderAll;
            });
            
            // Empty cells for A9-E9 to maintain borders
            ['A', 'B', 'C', 'D', 'E'].forEach(col => {
                wsTab.getCell(`${col}9`).border = borderAll;
            });
        }

        // --- ROW 10+ (Students) ---
        students.forEach((s, idx) => {
            const rowNum = (hasCOs ? 10 : 9) + idx;
            wsTab.getCell(`A${rowNum}`).value = idx + 1;
            wsTab.getCell(`B${rowNum}`).value = s.fullName;
            wsTab.getCell(`C${rowNum}`).value = s.rollNumber;
            wsTab.getCell(`D${rowNum}`).value = subjectName;

            const cols = hasCOs ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] : ['A', 'B', 'C', 'D', 'E'];
            cols.forEach(c => {
                wsTab.getCell(`${c}${rowNum}`).border = borderAll;
                wsTab.getCell(`${c}${rowNum}`).alignment = centerAlign;
            });
        });
    };

    addStandardSheet('QUIZ TEST', 'Marks (5)', true, 5, [2.5, 1, 1.5, 0, 0]);
    addStandardSheet('ASSIGNMENT', 'Marks (10)', true, 10, [2, 6, 2, 0, 0]);
    addStandardSheet('ATTENDANCE', 'Marks (5)', false, 5);

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Internal_Marks_Template_${batchName}.xlsx`);
};

export const downloadExternalTemplate = async (batchName: string, schoolName: string, subjectName: string, semester: string, students: any[]) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('end sem');

    const borderAll = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
    };
    const centerAlign = { vertical: 'middle' as const, horizontal: 'center' as const };
    const boldFont = { bold: true };

    ws.mergeCells('A1:C1'); ws.getCell('A1').value = 'OUTR';
    ws.mergeCells('A2:C2'); ws.getCell('A2').value = schoolName;
    ws.mergeCells('A3:C3'); ws.getCell('A3').value = `Sub, ${subjectName} 2024-25`;
    ws.mergeCells('A4:C4'); ws.getCell('A4').value = `Sem- ${semester}`;
    ['A1', 'A2', 'A3', 'A4'].forEach(c => {
        ws.getCell(c).font = boldFont; ws.getCell(c).alignment = centerAlign; ws.getCell(c).border = borderAll;
    });

    ws.getCell('D1').value = 'Attainment Lev'; ws.mergeCells('E1:H1'); ws.getCell('E1').value = 'Description';
    [1, 2, 3].forEach((v, i) => {
        ws.getCell(`D${i+2}`).value = v; ws.mergeCells(`E${i+2}:H${i+2}`);
        ws.getCell(`E${i+2}`).value = `${60 + i*5}% Students Scored more than 50%`;
    });

    // Row 6 headers
    const headers = ['Name', 'RegNO', 'SUBJECT CODE', 'QNo'];
    for(let i=0; i<10; i++) headers.push(`1(${String.fromCharCode(97+i)})`);
    for(let i=2; i<=5; i++) { headers.push(`${i}a`); headers.push(`${i}b`); headers.push(`${i}c`); }
    headers.push('Total');
    ws.addRow(headers);

    const cos = ['', '', '', 'CO'];
    for(let i=0; i<10; i++) cos.push(`CO1`);
    for(let i=2; i<=5; i++) { cos.push(`CO2`); cos.push(`CO3`); cos.push(`CO4`); }
    cos.push('');
    ws.addRow(cos);

    const marks = ['', '', '', 'Mark (60)'];
    for(let i=0; i<10; i++) marks.push(`2`);
    for(let i=2; i<=5; i++) { marks.push(`5`); marks.push(`5`); marks.push(`5`); }
    marks.push('60');
    ws.addRow(marks);

    students.forEach(s => {
        const row = [s.fullName, s.rollNumber, subjectName, ''];
        for(let i=0; i<22; i++) row.push('');
        row.push(''); // Total
        ws.addRow(row);
    });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `External_Marks_Template_${batchName}.xlsx`);
};
