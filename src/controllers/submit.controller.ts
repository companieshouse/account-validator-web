import { Response, Request, Router, NextFunction } from "express";
import { MAX_FILE_SIZE } from "../config";
import { Templates, Urls } from "../constants";
import multer from "multer";
import { ValidationResult } from "../validation/validation.result";
import { AccountValidationResult, accountValidatorService } from "../services/account.validation.service";
import { logger } from "../utils/logger";
import { handleErrors } from "../middleware/error.handler";

interface SubmitPageRequest extends Request {
    formValidationResult?: ValidationResult;
    accountValidationResult?: AccountValidationResult;
}

function addFormValidationResult(req: SubmitPageRequest, res: Response, next: NextFunction) {
    req.formValidationResult = req.formValidationResult ?? new ValidationResult;

    next();
}

// multipart/form-data middleware
const parseMultipartForm = multer({
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, // only 1 file per request
    },
    storage: multer.memoryStorage(),
});

function renderSubmitPage(req: SubmitPageRequest, res: Response) {
    return res.render(Templates.SUBMIT, {
        templateName: Templates.SUBMIT,
        formValidationResult: req.formValidationResult,
        accountValidationResult: req.accountValidationResult,
        fileName: req.file?.originalname
    });
}

function validateForm(file?: Express.Multer.File) {
    const validationResult = new ValidationResult();

    if (file === undefined) {
        validationResult.addError(
            "file",
            "Select an accounts file."
        );
    } else if (!isZipOrXBRLFile(file.originalname)) {
        validationResult.addError(
            "file",
            "The selected file must be a XHTML or ZIP."
        );
    }

    return validationResult;
}

const allowedFileExtensions = [
    "zip", "xhtml"
];

function extention(filename: string) {
    return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isZipOrXBRLFile(filename: string): boolean {
    // TODO: this probably isn't the best way to check file type.
    return allowedFileExtensions.includes(extention(filename));
}

async function submitFileForValidation(req: SubmitPageRequest, res: Response, next: NextFunction) {
    const fileValidationResult = validateForm(req.file);
    req.formValidationResult = fileValidationResult;

    // Check that the file is okay to submit to the API for validation
    if (fileValidationResult.hasErrors) {
        res.status(400);
        next();
        return;
    }

    logger.debug(`Submitting file to account-validator-api for validation`);
    // We know the file is not undefined since if the validation did not succeed we wouldn't have made it to this point
    req.accountValidationResult = await accountValidatorService.submit(req.file!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    logger.debug(`Response recieved from account-validator-api`);

    next();
}

export const submitController = Router();
submitController.use(addFormValidationResult);

submitController.get("/", renderSubmitPage);

submitController.post(
    "/",
    parseMultipartForm.single("file"),
    handleErrors(submitFileForValidation),
    (req: SubmitPageRequest, res: Response) => {
        if (req.formValidationResult?.hasErrors) {
            return renderSubmitPage(req, res);
        } else {
            return res.redirect(`${Urls.RESULT}/${req.accountValidationResult?.fileId}`);
        }
    }
);
