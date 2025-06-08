import XLSX from 'xlsx';

export const writeExcelFile = (data, filePath) => {

    const arr = [];
    for(let i = 0; i < data.length; i++) {
        arr.push({
            srno: i + 1,
            ...data[i]
        });
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(arr);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    // Write the workbook to a file
    XLSX.writeFile(workbook, filePath);
}