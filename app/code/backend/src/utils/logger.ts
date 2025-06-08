import chalk from "chalk";
import { Chalk } from "chalk";

/**
 * Logger utility for colorful and structured console output
 */
class Logger {
    /**
     * Log an info message
     * @param message The message to log
     * @param context Optional context for the log
     */
    info(message: string, context?: string): void {
        const timestamp = new Date().toISOString();
        const contextStr = context ? chalk.cyan(`[${context}]`) : "";
        console.log(`\n${chalk.gray(timestamp)} ${chalk.blue("INFO")}    ${contextStr}\t${message}`);
    }

    /**
     * Log a success message
     * @param message The message to log
     * @param context Optional context for the log
     */
    success(message: string, context?: string): void {
        const timestamp = new Date().toISOString();
        const contextStr = context ? chalk.cyan(`[${context}]`) : "";
        console.log(`\n${chalk.gray(timestamp)} ${chalk.green("SUCCESS")} ${contextStr}\t${message}`);
    }

    /**
     * Log a warning message
     * @param message The message to log
     * @param context Optional context for the log
     */
    warn(message: string, context?: string): void {
        const timestamp = new Date().toISOString();
        const contextStr = context ? chalk.cyan(`[${context}]`) : "";
        console.log(`\n${chalk.gray(timestamp)} ${chalk.yellow("WARNING")} ${contextStr}\t${message}`);
    }

    /**
     * Log an error message
     * @param message The error message
     * @param error Optional error object
     * @param context Optional context for the log
     */
    error(message: string, error?: Error, context?: string): void {
        const timestamp = new Date().toISOString();
        const contextStr = context ? chalk.cyan(`[${context}]`) : "";
        console.error(`\n${chalk.gray(timestamp)} ${chalk.red("ERROR")} ${contextStr}\t${message}`);

        if (error?.stack) {
            console.error(chalk.red(error.stack));
        }
    }

    /**
     * Log a server event
     * @param message The server event message
     */
    server(message: string): void {
        const padding = 4;
        const totalWidth = message.length + padding * 2;

        console.log("\n" + chalk.cyan("╭" + "─".repeat(totalWidth) + "╮"));
        console.log(
            chalk.cyan("│") + " ".repeat(padding) + chalk.bold.cyan(message) + " ".repeat(padding) + chalk.cyan("│")
        );
        console.log(chalk.cyan("╰" + "─".repeat(totalWidth) + "╯") + "\n");
    }

    /**
     * Log a route to the console
     * @param route The route path
     * @param method Optional HTTP method
     */
    route(route: string, method?: string): void {
        const methodColor = method ? this.getMethodColor(method) : chalk.white;
        const methodStr = method ? `[${methodColor(method.toUpperCase())}]` : "";
        console.log(`\n${chalk.cyan("→")} ${methodStr} ${chalk.white(route)}`);
    }

    /**
     * Get color for HTTP method
     */
    getMethodColor(method: string): Chalk {
        switch (method.toUpperCase()) {
            case "GET":
                return chalk.green;
            case "POST":
                return chalk.yellow;
            case "PUT":
                return chalk.blue;
            case "DELETE":
                return chalk.red;
            case "PATCH":
                return chalk.magenta;
            default:
                return chalk.white;
        }
    }
}

export const logger = new Logger();