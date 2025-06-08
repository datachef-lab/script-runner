// Purpose: Entry point for the backend server.
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import { Server } from "http";
import app from "./app.js";
import "tsconfig-paths/register";
import { logError, handleShutdown } from "./utils/server-helpers.js";
import { logger } from "./utils/logger.js";
import chalk from "chalk";

/**
 * Define the port for the server to listen on.
 * Uses environment variable PORT or defaults to 8080.
 */
const PORT: number = parseInt(process.env.PORT || "8080", 10);
let server: Server;

/**
 * Start the server and print available routes for debugging.
 */
try {
    server = app.listen(PORT, () => {
        logger.server("Script Runner Server");

        logger.info("Available Routes:", "Server");

        // Get all registered routes and group them together before logging
        const routes = app._router.stack
            .filter((r: { route?: { path: string; methods?: Record<string, boolean> } }) => r.route && r.route.path)
            .map((r: { route: { path: string; methods?: Record<string, boolean> } }) => {
                // Get the HTTP method
                const method = r.route.methods
                    ? Object.keys(r.route.methods).find((m) => r.route.methods![m])
                    : undefined;

                return { path: r.route.path, method };
            });

        // Log all routes together with just one newline at the start
        console.log(
            "\n" +
            routes
                .map((route: { path: string; method?: string }) => {
                    const methodColor = route.method ? logger.getMethodColor(route.method) : chalk.white;
                    const methodStr = route.method ? `[${methodColor(route.method.toUpperCase())}]` : "";
                    return `  ${chalk.cyan("→")} ${methodStr} ${chalk.white(route.path)}`;
                })
                .join("\n")
        );

        logger.success(`Server is running at http://localhost:${PORT}`, "Server");
    });
} catch (err) {
    logError(err as Error, "Server Startup Error");
    process.exit(1);
}

/**
 * Handles uncaught exceptions and logs the error details
 */
process.on("uncaughtException", (err: Error) => {
    logError(err, "Uncaught Exception");
    process.exit(1);
});

/**
 * Handle unhandled promise rejections and ensure a graceful shutdown.
 */
process.on("unhandledRejection", (reason: Error) => {
    logError(reason, "Unhandled Rejection");
    if (server) {
        server.close(() => {
            logger.warn("Shutting down server due to unhandled rejection", "System");
            process.exit(1);
        });
    }
});

// Graceful shutdown for SIGTERM and SIGINT
process.on("SIGTERM", () => handleShutdown("SIGTERM", server));
process.on("SIGINT", () => handleShutdown("SIGINT", server));

/**
 * Handle process exit events to clean up resources
 */
process.on("exit", () => {
    // ... other cleanup as needed
});