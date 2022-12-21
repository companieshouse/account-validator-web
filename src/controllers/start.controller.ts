import { Handler } from "express";
import { CHS_URL, MAX_FILE_SIZE } from "../config";
import { Templates } from "../types/template.paths";
import multer from "multer";

export const get: Handler = (req, res) => {
    return res.render(Templates.START, {
        CHS_URL,
        templateName: Templates.START,
    });
};

// multipart/form-data middleware
const parseMultipartForm = multer({
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, // only 1 file per request
    },
    storage: multer.memoryStorage(),
});

export const post: Handler[] = [
    parseMultipartForm.single("file"),

    (req, res) => {
        // const {originalname } = req.file

        return res.render(Templates.START, {
            CHS_URL,
            templateName: Templates.START,
        });
    },
];


