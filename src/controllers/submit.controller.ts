import { Response, Request, Router, NextFunction } from "express";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "../config";
import { ErrorMessages, FILE_UPLOAD_FIELD_NAME, Templates } from "../constants";
import multer from "multer";
import { ValidationResult } from "../validation/validation.result";
import {
    AccountValidationResult,
    accountValidatorService,
} from "../services/account.validation.service";
import { logger } from "../utils/logger";
import { handleErrors } from "../middleware/error.handler";
import { validateSubmitRequest } from "../middleware/submit.validation.middleware";

export interface SubmitPageRequest extends Request {
    formValidationResult?: ValidationResult;
    accountValidationResult?: AccountValidationResult;
}

function addFormValidationResult(
    req: SubmitPageRequest,
    res: Response,
    next: NextFunction
) {
    req.formValidationResult =
        req.formValidationResult ?? new ValidationResult();

    next();
}

function multerMiddleware(req: SubmitPageRequest, res: Response, next: NextFunction) {
    const upload = multer({
        limits: {
            fileSize: MAX_FILE_SIZE,
            files: 1, // only 1 file per request
        },
        storage: multer.memoryStorage(),
    }).single(FILE_UPLOAD_FIELD_NAME);

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            if (req.formValidationResult === undefined) {
                req.formValidationResult = new ValidationResult();
            }

            req.formValidationResult.addError(FILE_UPLOAD_FIELD_NAME, ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
            next();
            return;
        }

        if (err) {
            next(err);
            return;
        }

        next();
    });
}

function renderSubmitPage(req: SubmitPageRequest, res: Response) {
    if (req.formValidationResult?.hasErrors) {
        res.status(400);
    }

    return res.render(Templates.SUBMIT, {
        templateName: Templates.SUBMIT,
        formValidationResult: req.formValidationResult,
        accountValidationResult: req.accountValidationResult,
        fileName: req.file?.originalname,
        FILE_UPLOAD_FIELD_NAME: FILE_UPLOAD_FIELD_NAME
    });
}

async function submitFileForValidation(
    req: SubmitPageRequest,
    res: Response,
    next: NextFunction
) {
    if (req.formValidationResult === undefined || req.formValidationResult.hasErrors) {
        res.status(400);
        next();
        return;
    }

    logger.debug(`Submitting file to account-validator-api for validation`);
    // We know the file is not undefined since if the validation did not succeed we wouldn't have made it to this point
    req.accountValidationResult = await accountValidatorService.submit(
        req.file! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    );
    logger.debug(`Response recieved from account-validator-api`);

    next();
}

export const submitController = Router();
submitController.use(addFormValidationResult);

submitController.post(
    "/validate",
    validateSubmitRequest,
    renderSubmitPage
);

submitController.get("/", renderSubmitPage);

submitController.post(
    "/",
    multerMiddleware,
    validateSubmitRequest,
    handleErrors(submitFileForValidation),
    (req: SubmitPageRequest, res: Response) => {
        if (req.formValidationResult?.hasErrors) {
            return renderSubmitPage(req, res);
        } else {
            return res.json({ fileId: req.accountValidationResult?.fileId });
        }
    }
);
