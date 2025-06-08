import { NextFunction, Response, Request } from "express";
import { logEvents } from "./logger.middleware.js";
import { format } from "date-fns";
import { ApiError } from "../utils/api-error.js";

export const handleError = (error: unknown, res: Response, next?: NextFunction) => {
    if (typeof error === "object" && error !== null && "code" in error) {
        const dbError = error as { code: string; message: string };

        if (dbError.code === "23505") {
            res.status(409).json(new ApiError(409, `Duplicate entry: Please enter a valid record`));
        } else {
            res.status(500).json(new ApiError(500, `Database Error: ${dbError.message}`));
        }
    } else if (error instanceof Error) {
        if (error.message.includes("validation")) {
            res.status(400).json(new ApiError(400, `Validation Error: ${error.message}`));
        } else if (
            error.message.includes("Unauthorized") ||
            (error instanceof Error && error.name === "TokenExpiredError")
        ) {
            res.status(401).json(new ApiError(401, error.message));
        } else if (error.message.includes("Forbidden")) {
            res.status(403).json(new ApiError(403, `Forbidden: ${error.message}`));
        } else if (error.message.includes("Too Many Requests")) {
            res.status(429).json(new ApiError(429, `Too Many Requests: ${error.message}`));
        } else {
            res.status(500).json(new ApiError(500, `Unexpected Error: ${error.message}`));
        }
    } else {
        res.status(500).json(new ApiError(500, `Unknown Error: An unexpected error occurred`));
    }

    if (next) next(error);
};

export const errorHandler = (
    err: Error | ApiError | { code: string; message: string },
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Generate dynamic log file name based on current date
    const logFileName = `errLog_${format(new Date(), "dd-MM-yyyy")}.log`;

    // Create error message based on type
    let errorName = "UnknownError";
    if (err instanceof Error) {
        errorName = err.name;
    } else if ("code" in err) {
        errorName = `DB Error ${err.code}`;
    }

    // Create a safe message without assuming headers properties exist
    const method = req.method || "undefined";
    const url = req.url || "undefined";
    const origin = req.headers?.origin || "undefined";

    logEvents(`${errorName}: ${err.message}\t${method}\t${url}\t${origin}`, logFileName);
    console.error(err instanceof Error ? err.stack : err.message);

    // Continue to the next middleware
    next(err);
};