import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import morgan from "morgan";
import express, { Request, Response } from "express";
import endpoints from "express-list-endpoints";
import chalk from "chalk";
import path from "path";
import { logger } from "./middlewares/logger.middleware";
import { corsOptions } from "./config/cors-options";
// import http from 'http';
// import { Server } from 'socket.io';

import { approvalRouter } from "./routes/college-approval.route";
import { webScrapeMarksRouter } from "./routes/web-scrape-marks.route";

// const DOCUMENT_PATH = process.env.DOCUMENT_PATH!;

const app = express();
// const server = http.createServer(app);
// const io = new Server(server);


app.use(logger);

app.use(express.json()); // Parse incoming JSON requests

app.use(express.urlencoded({ extended: true })); // Parse incoming requests with urlencoded payloads

app.use(cors(corsOptions));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Specific route for CSS files
app.use("/css", express.static(path.join(__dirname, "..", "public/styles")));

// Route for serving index.html
app.get("^/$|/index(.html)?", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

// **Custom Morgan Token for Status Colors**
morgan.token("status-colored", (req, res) => {
    // Get the status code from the response
    const status = res.statusCode;

    // Choose the color based on the status code
    let color;
    if (status >= 500) color = chalk.red;
    else if (status >= 400) color = chalk.yellow;
    else if (status >= 300) color = chalk.cyan;
    else if (status >= 200) color = chalk.green;
    else color = chalk.white;

    return color(status);
});

// **Custom Morgan Token for Method Colors**
morgan.token("method-colored", (req) => {
    // Get the method from the request
    const method = req.method;

    // Choose the color based on the method
    let color;
    switch (method) {
        case "GET":
            color = chalk.green;
            break;
        case "POST":
            color = chalk.yellow;
            break;
        case "PUT":
            color = chalk.blue;
            break;
        case "DELETE":
            color = chalk.red;
            break;
        case "PATCH":
            color = chalk.magenta;
            break;
        default:
            color = chalk.white;
    }

    return color(method);
});

// **Request Logging Setup with Morgan**
if (process.env.NODE_ENV === "development") {
    // Custom format for development
    // Using any for tokens because of compatibility issues with morgan types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customFormat = (tokens: any, req: Request, res: Response) => {
        const timestamp = new Date().toISOString();
        const method = tokens["method-colored"](req, res);
        const url = chalk.white(tokens.url(req, res));
        const status = tokens["status-colored"](req, res);
        const responseTime = chalk.magenta(`${tokens["response-time"](req, res)} ms`);
        const contentLength = tokens.res(req, res, "content-length") || "-";

        return `\n${chalk.gray(timestamp)} ${chalk.cyan("HTTP")} ${method} ${url} ${status} ${responseTime} - ${contentLength}`;
    };

    app.use(morgan(customFormat));
} else {
    // In production, log requests in the 'combined' format (standard Apache combined log format)
    app.use(morgan("combined"));
}

// **Health Check Route**
// A simple GET endpoint to check if the server is running
app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Server health is ok!",
    });
});

// **Endpoint Listing Route**
// Return a list of all registered routes in the application
app.get("/routes", (req, res) => {
    res.status(200).send(endpoints(app));
});

app.use("/college-approval", approvalRouter);

app.use("/web-scrape-marks", webScrapeMarksRouter);


app.all("*", (req: Request, res: Response) => {
    res.status(404);
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "..", "views", "404.html"));
    } else if (req.accepts("json")) {
        res.json({ message: "404 Not Found" });
    } else {
        res.type("txt").send("404 Not Found");
    }
});

export default app;