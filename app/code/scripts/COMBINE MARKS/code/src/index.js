import path from "path";
import fs from "fs";
import { readExcelFile } from "./actions/readExcelFile.js";
import { getAllSubjects } from "./actions/getAllSubjects.js";
import { writeExcelFile } from "./actions/writeExcelFile.js";

console.log("\nSCRIPT : MERGE ALL SUBJECTS TO SEPARATE COLUMNS");
console.log("VERSION: 1.0");
console.log("------------------------------------------------");

// FILE NAME
const filePathCSV = path.join(process.cwd(), "../data/input/excel_data.csv");
const filePathEXCEL = path.join(process.cwd(), "../data/input/excel_data.xlsx");

// FUNCTION TO CHECK IF A FILE EXIST
const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        console.error("Error checking file existence:", err);
        return false;
    }
}

// READ THE EXCEL FILE
let dataArr;
if (fileExists(filePathCSV)) {
    // Read CSV file
    dataArr = readExcelFile(filePathCSV);
} else {
    // Read Excel file
    dataArr = readExcelFile(filePathEXCEL);
}

console.log("\n\nOperations: -\n")
console.log("1. Scanning the file...");
console.log("2. Records Scanned:", dataArr.length);

// GET ALL THE SUBJECTS
const subjectsArr = getAllSubjects(dataArr);

// PROCESS THE ENTRIES
const doneRollNo = new Set();
const allArr = [];
for (let i = 0; i < dataArr.length; i++) {
    let rollNo = dataArr[i]["roll_no"];
    // Skip the iteration if already processed
    if (doneRollNo.has(rollNo)) { continue; }

    let rollNoArr = dataArr.filter((ele) => ele["roll_no"] == rollNo);

    let obj = {
        registration_no: dataArr[i]["registration_no"],
        roll_no: dataArr[i]["roll_no"],
        stream: dataArr[i]["stream"],
        course: dataArr[i]["course"],
        semester: dataArr[i]["semester"],
        name: dataArr[i]["name"],
        sgpa: dataArr[i]["sgpa"],
        remarks: dataArr[i]["remarks"],
        grade: dataArr[i]["grade"],
        grand_total: 0, // Need to calculate
        full_marks_sum: 0, // Need to calculate
    }


    // if (dataArr[i].sgpa != undefined && (dataArr[i].sgpa.includes("SGPA: ") || dataArr[i].sgpa.includes("SGPA:") || dataArr[i].sgpa.includes("sgpa: ") || dataArr[i].sgpa.includes("sgpa:"))) {
    //     obj.sgpa = dataArr[i]?.sgpa.replace("SGPA: ", '');
    // }

    console.log(dataArr[i]?.sgpa)
    if (dataArr[i].sgpa != undefined) {
        obj.sgpa = dataArr[i]?.sgpa;

    }

    if (dataArr[i].remarks != undefined && (dataArr[i]?.remarks.includes("Remarks: ") || dataArr[i]?.remarks.includes("Remarks:"))) {
        obj.remarks = dataArr[i]?.remarks.replace("Remarks: ", '');
    }


    // Add all subjects with empty values
    for (const subject of subjectsArr) {
        obj[`${subject}_i`] = '';
        obj[`${subject}_p`] = '';
        obj[`${subject}_t`] = '';
    }
    // console.log(" in 71, obj", obj)
    // Add the present subjects
    let doneSubjects = [];
    for (let j = 0; j < rollNoArr.length; j++) {
        let subjectName = rollNoArr[j]["subject"];

        
        obj[`${subjectName}_i`] = rollNoArr[j]["internal_marks"];
        obj[`${subjectName}_p`] = rollNoArr[j]["practical_marks"];
        obj[`${subjectName}_t`] = rollNoArr[j]["theory_marks"];
        obj[`${subjectName}_status`] = rollNoArr[j]["status"];
        

        obj.grand_total += rollNoArr[j]["total"];
        obj.full_marks_sum += (rollNoArr[j]["full_marks"]) ? rollNoArr[j]["full_marks"] : 100;

        doneSubjects.push(rollNoArr[j]["subject"]);
    }





    // Add the obj to the allArr[]
    allArr.push(obj);

    // Marks the roll_no as done
    doneRollNo.add(rollNo);
}

console.log("3. Total records after conversion:", allArr.length)

// WRITE IN EXCEL FILE
console.log("\nGenerating the excel file...")
writeExcelFile(allArr, path.join(process.cwd(), "../data/output/merge-subjects-output.xlsx"));
console.log("\nExcel file generated... please visit the following path;")
console.log(path.join(process.cwd(), "../data/output/merge-subjects-output.xlsx"));
console.log("\nHappy hacking...!\n\n");