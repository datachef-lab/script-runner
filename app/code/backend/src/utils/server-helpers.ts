// Purpose: Common server utilities and helpers.
import { Server } from "http";
import { logger } from "./logger.js";

/*
 * Utility function for logging errors
 * @param {Error} error - The error object to log
 * @param {string} context - The context in which the error occurred
 *
 * @returns {void}
 */
export const logError = (error: Error, context: string): void => {
    logger.error("An error occurred", error, context);
};

/*
 * Handle server shutdown gracefully
 * @param {string} signal - The signal that triggered the shutdown
 * @param {Server} server - The server instance to close
 *
 * @returns {Promise<void>}
 */
export const handleShutdown = async (signal: "SIGTERM" | "SIGINT", server: Server) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`, "System");

    if (server) {
        server.close(() => logger.info("Server closed", "Shutdown"));
    }

    try {
        logger.info("Database connection closed", "Shutdown");
        process.exit(0);
    } catch (error) {
        logError(error as Error, "Shutdown Error");
        process.exit(1);
    }
};