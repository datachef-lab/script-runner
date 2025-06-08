// import XLSX from "xlsx";

// export const readExcelFile = (filePath) => {
//     // Load workbook
//     const workbook = XLSX.readFile(filePath);
    
//     // Choose the first sheet
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
    
//     // Convert sheet to JSON object
//     const dataArr = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
//     return dataArr;
// }

import XLSX from "xlsx";

export const readExcelFile = (filePath) => {
    // Load workbook
    const workbook = XLSX.readFile(filePath);
    
    // Choose the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON object
    const dataArr = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Extract headers
    const headers = dataArr[0];

    // Convert each row into an object
    const dataArrayWithObjects = dataArr.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });
    
    return dataArrayWithObjects;
}
