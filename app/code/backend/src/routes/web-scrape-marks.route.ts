import express, { Request, Response, RequestHandler } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ApiResponse } from "../utils/api-response";
import { uploadExcelMiddleware } from '../middlewares/upload.middleware';
import { io } from '../app';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fix the path construction
const SCRIPT_PATH = path.resolve(__dirname, "../../../scripts/WEB-SCRAPE MARKS");
const DATA_PATH = path.resolve(__dirname, "../../../../data");

const router = express.Router();

// Variable to store the child process instance
let pythonProcess: ChildProcess | null = null;

// Define the Python executable path explicitly
const PYTHON_EXECUTABLE = 'D:\\DataChef\\script-runner\\app\\code\\.venv\\Scripts\\python.exe';

// Define the request body interface
interface WebScrapeRequest {
    inputFile: string;
    outputFile: string;
    logFile: string;
    column: string;
    start?: number;
    count?: number;
    delay?: number;
    debug?: boolean;
    baseUrl: string;
}

// Define the Python script path - Fix the path construction
const pythonScriptPath = path.join(SCRIPT_PATH, 'main.py');

// Define the uploads directory path
const uploadsDir = path.join(DATA_PATH, 'uploads');

// Define the outputs directory path
const outputsDir = path.join(DATA_PATH, 'outputs');

// Ensure the uploads and outputs directories exist
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory:', uploadsDir);
    }
    if (!fs.existsSync(outputsDir)) {
        fs.mkdirSync(outputsDir, { recursive: true });
        console.log('Created outputs directory:', outputsDir);
    }
} catch (error) {
    console.error('Error creating directories:', error);
    throw new Error('Failed to create required directories');
}

router.post('/', uploadExcelMiddleware, (async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!req.body.baseUrl) {
            return res.status(400).json({ error: 'baseUrl is required' });
        }

        const { baseUrl } = req.body;
        const fileName = req.file.filename;

        // Resolve file paths
        const inputFilePath = path.join(uploadsDir, fileName);
        const outputFilePath = path.join(outputsDir, 'exam_results.xlsx');
        const logFilePath = path.join(outputsDir, 'scraping_log.xlsx');

        // Check if input file exists
        if (!fs.existsSync(inputFilePath)) {
            return res.status(404).json({ error: 'Input file not found' });
        }

        // Prepare command line arguments
        const args = [
            '--input', inputFilePath,
            '--output', outputFilePath,
            '--log', logFilePath,
            '--base-url', baseUrl
        ];

        // Add optional arguments if provided
        // if (baseUrl) args.push('--base-url', baseUrl);
        // if (column) args.push('--column', column);
        // if (start !== undefined) args.push('--start', start.toString());
        // if (count) args.push('--count', count.toString());
        // if (delay) args.push('--delay', delay.toString());
        // if (debug) args.push('--debug');

        // Spawn Python process
        pythonProcess = spawn(PYTHON_EXECUTABLE, [pythonScriptPath, ...args], {
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });

        // Handle client disconnection
        req.on('close', () => {
            if (!res.writableEnded) {
                pythonProcess?.kill();
                pythonProcess = null;
                res.end();
            }
        });

        // Collect output
        let output = '';
        let error = '';

        if (pythonProcess) {
            const currentPythonProcess = pythonProcess;

            currentPythonProcess.stdout?.on('data', (data) => {
                const chunk = data.toString();
                output += chunk;
                // Emit real-time output to connected clients
                io.emit('script-output', { type: 'stdout', data: chunk });
            });

            currentPythonProcess.stderr?.on('data', (data) => {
                const chunk = data.toString();
                error += chunk;
                // Emit real-time errors to connected clients
                io.emit('script-output', { type: 'stderr', data: chunk });
            });
        }

        // Handle process completion
        pythonProcess?.on('close', (code) => {
            if (code === 0) {
                // Process completed successfully
                const response = {
                    success: true,
                    message: 'Script executed successfully',
                    output: output,
                    outputFile: path.basename(outputFilePath),
                    logFile: path.basename(logFilePath)
                };
                // Emit completion event
                io.emit('script-complete', response);
                res.end(JSON.stringify(response));
            } else {
                // Process failed
                const response = {
                    success: false,
                    message: 'Script execution failed',
                    error: error,
                    code: code
                };
                // Emit completion event
                io.emit('script-complete', response);
                res.end(JSON.stringify(response));
            }
            pythonProcess = null; // Clear the process reference on close
        });

    } catch (error) {
        console.error('Error executing script:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

router.post('/terminate', (req: Request, res: Response) => {
    if (pythonProcess) {
        console.log("Attempting to terminate Python script...");
        pythonProcess.kill();
        pythonProcess = null;
        ApiResponse.success(res, { message: "Script termination requested." });
    } else {
        ApiResponse.badRequest(res, "No active script to terminate.");
    }
});

export {router as webScrapeMarksRouter };