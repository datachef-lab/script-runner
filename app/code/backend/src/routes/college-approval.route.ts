import { spawn } from "child_process";
import express, { Request, Response } from "express";
import { CurrentSession } from "../types/college-approval.type";
import { ApiResponse } from "../utils/api-response";
import path from "path";

const pythonPath = process.env.PYTHON_PATH || 'python'; // fallback to system python
console.log("python path:", pythonPath);

const BASE_PATH = "../../scripts/COLLEGE APPROVAL";

export const approvalRouter = express.Router();

approvalRouter.get("/", async (req: Request, res: Response) => {
    // Step 1: Get the URL and session ID from the Python script
    const currentSession = await getUrlAndSessionId();
    if (!currentSession) {
        ApiResponse.unprocessableEntity(res, "Failed to retrieve session data");
        return;
    }


    const executorUrl = currentSession.url;          // e.g. "http://127.0.0.1:57260"
    const sessionId = currentSession.session_id;     // e.g. "539c515e188a00228f8988537296a82a"
    const approvalPageUrl = "https://www.cuexamwindow.in/CollegeApprovalCandidateList.aspx?rand=26/05/2025-16:06:27"; // TODO: Will be set after selecting filters
    const csvFilePath = "./scripts/COLLEGE APPROVAL/sheet/sheet1.csv"; // TODO

    // Step 2-3: Provide the two links for the user along with the user_id and password so that they can open them in the automated browser opened by the Python script. All the manual actions will be done in that browser.

    // Step 4-5: To get the url of the automated browser from the frontend

    // Step 6: Spawn Python script with args
    // const scriptPath = path.resolve(__dirname, `${BASE_PATH}/approval.py`);
    // const python = spawn(pythonPath, [
    //     scriptPath,
    //     executorUrl,
    //     sessionId,
    //     approvalPageUrl,
    //     csvFilePath,
    // ]);

    // let stdoutData = "";
    // let stderrData = "";

    // python.stdout.on("data", (data) => {
    //     stdoutData += data.toString();
    // });

    // python.stderr.on("data", (data) => {
    //     stderrData += data.toString();
    //     console.error("Python error:", data.toString());
    // });

    // python.on("close", (code) => {
    //     if (code !== 0) {
    //         ApiResponse.unprocessableEntity(res, `Python script exited with code ${code}. Error: ${stderrData}`);
    //         return;
    //     }
    //     // Return whatever Python printed to stdout
    //     res.json({ message: "Approval process done", details: stdoutData });
    // });

});

async function processAproval(
    executorUrl: string,
    sessionId: string,
    approvalPageUrl: string,
    csvFilePath: string
) {
    const scriptPath = path.resolve(__dirname, `${BASE_PATH}/approval.py`);
    const python = spawn(pythonPath, [
        scriptPath,
        executorUrl,
        sessionId,
        approvalPageUrl,
        csvFilePath,
    ]);

    let stdoutData = "";
    let stderrData = "";

    python.stdout.on("data", (data) => {
        stdoutData += data.toString();
    });

    python.stderr.on("data", (data) => {
        stderrData += data.toString();
        console.error("Python error:", data.toString());
    });

    python.on("close", (code) => {
        if (code !== 0) {
            ApiResponse.unprocessableEntity(res, `Python script exited with code ${code}. Error: ${stderrData}`);
            return;
        }
        // Return whatever Python printed to stdout
        // res.json({ message: "Approval process done", details: stdoutData });
    });
}

async function getUrlAndSessionId(): Promise<CurrentSession | null> {
    const scriptPath = path.resolve(__dirname, `${BASE_PATH}/starting/get_session.py`);

    console.log("scriptPath:", scriptPath);

    return new Promise((resolve) => {
        const python = spawn(pythonPath, [scriptPath]);

        let jsonBuffer = "";

        python.stdout.on("data", (data) => {
            console.log(data.toString());
            jsonBuffer += data.toString();
        });

        python.stderr.on("data", (data) => {
            console.error("Error from Python script:", data.toString());
        });

        python.on("close", () => {
            try {
                const currentSession: CurrentSession = JSON.parse(jsonBuffer.trim());
                resolve(currentSession);
            } catch (err) {
                console.error("Failed to parse session data:", err);
                resolve(null);
            }
        });
    });
}