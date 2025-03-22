import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ValidationResult } from "../validation/validation.result";
import {
    AccountValidationResult,
} from "../services/account.validation.service";
import { ErrorMessages, FILE_UPLOAD_FIELD_NAME } from "../constants";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "../config";

interface SubmitPageRequest extends Request {
    formValidationResult?: ValidationResult;
    accountValidationResult?: AccountValidationResult;
}

export const multipartMiddleware = () => {
    return (req: SubmitPageRequest, res: Response, next: NextFunction) => {

        const upload = multer({
            limits: {
                fileSize: MAX_FILE_SIZE,
                files: 1, // only 1 file per request
            },
            storage: multer.memoryStorage(),
        }).fields([{ name: FILE_UPLOAD_FIELD_NAME, maxCount: 1 }, { name: "_csrf", maxCount: 1 }]);

        upload(req, res, function (err: any) {
            if (err) {
                if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                    if (req.formValidationResult === undefined) {
                        req.formValidationResult = new ValidationResult();
                    }
                    req.formValidationResult.addError(FILE_UPLOAD_FIELD_NAME, ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
                } else {
                    next(err);
                    return;
                }
            }
            next();
        });
    };
};
