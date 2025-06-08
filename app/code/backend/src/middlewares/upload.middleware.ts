import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

// Define storage settings
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(directoryName, "../../../../data/uploads")); // Save files in /data/uploads
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
    }
});

// File filter to allow only Excel files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-excel") {
        cb(null, true);
    } else {
        cb(new Error("Only Excel files are allowed!"));
    }
};

// Multer instance
const upload = multer({ storage, fileFilter });

// Middleware function
export const uploadExcelMiddleware = upload.single("file"); // 'file' should match frontend form field name