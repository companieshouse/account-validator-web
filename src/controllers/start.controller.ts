import { Response, Request, Router, NextFunction } from "express";
import { CHS_URL, MAX_FILE_SIZE } from "../config";
import { Templates } from "../types/template.paths";
import multer from "multer";
import { ValidationResult } from "../validation/validation.result";
import { AccountValidationResult, accountValidatorService } from "../services/account.validation.service";
import { logger } from "../utils/logger";
import { handleErrors } from "../middleware/error.handler";

interface StartPageRequest extends Request {
    formValidationResult?: ValidationResult;
    accountValidationResult?: AccountValidationResult;
}

function addFormValidationResult(req: StartPageRequest, res: Response, next: NextFunction) {
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

function renderStartPage(req: StartPageRequest, res: Response) {
    return res.render(Templates.START, {
        CHS_URL,
        templateName: Templates.START,
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
            "No file selected. Upload an XBRL or ZIP file to be validated."
        );
    } else if (!isZipOrXBRLFile(file.originalname)) {
        validationResult.addError(
            "file",
            "Uploaded file was not the correct type. Upload an XBRL or ZIP file to be validated."
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


async function submitFileForValidation(req: StartPageRequest, res: Response, next: NextFunction) {
    const fileValidationResult = validateForm(req.file);
    req.formValidationResult = fileValidationResult;

    // Check that the file is okay to submit to the API for validation
    if (fileValidationResult.hasErrors) {
        console.log(`Validation errors: ${JSON.stringify(fileValidationResult.errors)}`);
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

export const startController = Router();
startController.use(addFormValidationResult);

startController.get("/", renderStartPage);

startController.post(
    "/",
    parseMultipartForm.single("file"),
    handleErrors(submitFileForValidation),
    renderStartPage
);
