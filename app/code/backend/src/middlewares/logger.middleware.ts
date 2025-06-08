import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import fsPromise from "fs/promises";
import path from "path";
import { format } from "date-fns";
import { v4 as uuid } from "uuid";

import { NextFunction, Request, Response } from "express";

export const logEvents = async (message: string, logFileName: string) => {
    const dateTime = `${format(new Date(), "dd-MM-yyyy\tHH:mm:ss")}`;
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    console.log(`${dateTime}\t${uuid()}\t${message}`);

    const logsDir = logFileName.includes("errLog") ? "errLogs" : "reqLogs";

    // Use LOGS_PATH environment variable if available, or fall back to default path
    const baseLogDir = process.env.LOGS_PATH || path.join(__dirname, "../..", "logs");
    const targetLogDir = path.join(baseLogDir, logsDir);
    const logFilePath = path.join(targetLogDir, logFileName);

    try {
        // Ensure the base 'logs' directory exists
        if (!fs.existsSync(baseLogDir)) {
            await fsPromise.mkdir(baseLogDir);
        }

        // Ensure the 'logs/reqLogs' or 'logs/errLogs' directory exists
        if (!fs.existsSync(targetLogDir)) {
            await fsPromise.mkdir(targetLogDir);
        }

        // Read existing log content if the file exists
        let existingLogs = "";
        if (fs.existsSync(logFilePath)) {
            existingLogs = await fsPromise.readFile(logFilePath, "utf8");
        }

        // Prepend the new log item to the existing logs
        const updatedLogs = logItem + existingLogs;

        // Write the combined content back to the file
        await fsPromise.writeFile(logFilePath, updatedLogs);
    } catch (error) {
        console.error("Error writing log file:", error);
    }
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
    // Generate dynamic log file name based on current date
    const logFileName = `reqLog_${format(new Date(), "dd-MM-yyyy")}.log`;

    // Get the client's IP address
    let ip =
        req.ip ||
        req.socket.remoteAddress ||
        (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"] : null) ||
        "unknown";

    // Convert IPv6 localhost to IPv4 format
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
        ip = "127.0.0.1";
    } else if (ip && ip.startsWith("::ffff:")) {
        // Convert IPv6-mapped IPv4 addresses to IPv4 format
        ip = ip.substring(7);
    }

    // Use 'local' instead of undefined for origin when it's not present
    const origin = req.headers.origin || "local";

    logEvents(`${req.method}\t${ip}\t${origin}\t${req.url}`, logFileName);

    next();
};