import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ValidationResult } from "../validation/validation.result";
import {
    AccountValidationResult,
//    accountValidatorService,
} from "../services/account.validation.service";
import { ErrorMessages, FILE_UPLOAD_FIELD_NAME, PACKAGE_TYPE_KEY } from "../constants";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "../config";

interface SubmitPageRequest extends Request {
    formValidationResult?: ValidationResult;
    accountValidationResult?: AccountValidationResult;
}

export const multipartMiddleware = () => {
    return (req: SubmitPageRequest, res: Response, next: NextFunction) => {
        console.log('NSDBG MM enter url: ' + req.originalUrl);
        const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string | undefined;
        const sessionPackageType: string | undefined = req.session?.getExtraData<string>(PACKAGE_TYPE_KEY);

        if (packageType !== undefined && packageType?.toLowerCase() !== sessionPackageType?.toLowerCase()) {
            // throw new Error(`Query package type does not match session package type.`);
            console.log('NSDBG MM wrong pkg error');
            return next(new Error(`Query package type does not match session package type.`));
        }
        console.log('NSDBG MM proceed with pkg');

        const upload = multer({
            limits: {
                fileSize: MAX_FILE_SIZE,
                files: 1, // only 1 file per request
            },
            storage: multer.memoryStorage(),
        }).fields([{ name: FILE_UPLOAD_FIELD_NAME, maxCount: 1 }, { name: "_csrf", maxCount: 1 }]);

        upload(req, res, function (err) {
            console.log('NSDBG MM upload');
            if (err) {
                if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                    if (req.formValidationResult === undefined) {
                        req.formValidationResult = new ValidationResult();
                    }
                    req.formValidationResult.addError(FILE_UPLOAD_FIELD_NAME, ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
                } else {
                    next(err);
                    console.log('NSDBG MM upload return');
                    return;
                }
            }
            next();
        });
    };
};
