import { Response } from "express";
import { logger } from "./logger";

interface ApiResponseOptions {
    status?: number;
    message?: string;
    data?: unknown;
    errors?: unknown;
    meta?: Record<string, unknown>;
}

export class ApiResponse {
    /**
     * Send a successful response
     * @param res Express Response object
     * @param options Response options including status, message, data, and meta information
     */
    static success(res: Response, options: ApiResponseOptions = {}): void {
        const { status = 200, message = "Operation completed successfully", data = null, meta = {} } = options;

        const response = {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };

        logger.info(`API Response: ${message}`, "API");
        res.status(status).json(response);
    }

    /**
     * Send an unprocessable entity response
     * @param res Express Response object
     * @param message Custom unprocessable entity message
     * @param errors Validation or semantic errors
     * @param meta Additional meta information
     */
    static unprocessableEntity(
        res: Response,
        message = "Unprocessable entity",
        errors: unknown = null,
        meta: Record<string, unknown> = {}
    ): void {
        this.error(res, {
            status: 422,
            message,
            errors,
            meta,
        });
    }

    /**
     * Send a too many requests response
     * @param res Express Response object
     * @param message Custom too many requests message
     * @param meta Additional meta information
     */
    static tooManyRequests(res: Response, message = "Too many requests", meta: Record<string, unknown> = {}): void {
        this.error(res, {
            status: 429,
            message,
            meta,
        });
    }

    /**
     * Send a no content response
     * @param res Express Response object
     * @param message Optional message for logging purposes
     * @param meta Optional meta data for logging
     */
    static noContent(res: Response, options: ApiResponseOptions = {}): void {
        const { status = 204, message = "Operation completed successfully", data = null, meta = {} } = options;

        const response = {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };

        logger.info(`API Response: ${message}`, "API");
        res.status(status).json(response);
    }

    /**
     * Send an error response
     * @param res Express Response object
     * @param options Response options including status, message, errors, and meta information
     */
    static error(res: Response, options: ApiResponseOptions = {}): void {
        const { status = 500, message = "An unexpected error occurred", errors = null, meta = {} } = options;

        const response = {
            success: false,
            message,
            errors,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };

        logger.error(`API Error: ${message}`, errors as Error, "API");
        res.status(status).json(response);
    }

    /**
     * Send a not found response
     * @param res Express Response object
     * @param message Custom not found message
     * @param meta Additional meta information
     */
    static notFound(res: Response, message = "Resource not found", meta: Record<string, unknown> = {}): void {
        this.error(res, {
            status: 404,
            message,
            meta,
        });
    }

    /**
     * Send a bad request response
     * @param res Express Response object
     * @param message Custom bad request message
     * @param errors Validation or request errors
     * @param meta Additional meta information
     */
    static badRequest(
        res: Response,
        message = "Invalid request",
        errors: unknown = null,
        meta: Record<string, unknown> = {}
    ): void {
        this.error(res, {
            status: 400,
            message,
            errors,
            meta,
        });
    }

    /**
     * Send an unauthorized response
     * @param res Express Response object
     * @param message Custom unauthorized message
     * @param meta Additional meta information
     */
    static unauthorized(res: Response, message = "Unauthorized access", meta: Record<string, unknown> = {}): void {
        this.error(res, {
            status: 401,
            message,
            meta,
        });
    }

    /**
     * Send a forbidden response
     * @param res Express Response object
     * @param message Custom forbidden message
     * @param meta Additional meta information
     */
    static forbidden(res: Response, message = "Access forbidden", meta: Record<string, unknown> = {}): void {
        this.error(res, {
            status: 403,
            message,
            meta,
        });
    }

    /**
     * Send a conflict response
     * @param res Express Response object
     * @param message Custom conflict message
     * @param errors Conflict details
     * @param meta Additional meta information
     */
    static conflict(
        res: Response,
        message = "Resource conflict",
        errors: unknown = null,
        meta: Record<string, unknown> = {}
    ): void {
        this.error(res, {
            status: 409,
            message,
            errors,
            meta,
        });
    }
}