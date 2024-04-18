import { Response, Request, Router, NextFunction } from "express";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, UI_UPDATE_TIMEOUT_MS } from "../config";
import { ErrorMessages, FILE_UPLOAD_FIELD_NAME, Templates, errorMessage, Urls } from "../constants";
import multer from "multer";
import { ValidationResult } from "../validation/validation.result";
import {
    AccountValidationResult,
    accountValidatorService,
} from "../services/account.validation.service";
import { logger } from "../utils/logger";
import { handleErrors } from "../middleware/error.handler";
import { validateSubmitRequest } from "../middleware/submit.validation.middleware";
import { timeout } from "../middleware/timeout.middleware";
import { PackageType } from "private-api-sdk-node/dist/services/accounts-filing/types";

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

    const packageType = req.query?.packageType as string|undefined;

    checkPackageTypeIsUsedCorrectly(packageType);

    const submitUrl = isValidatedPackageTypePresent(packageType) ? `${Urls.SUBMIT}/?packageType=${req.query.packageType}` : Urls.SUBMIT;

    return res.render(Templates.SUBMIT, {
        templateName: Templates.SUBMIT,
        formValidationResult: req.formValidationResult,
        accountValidationResult: req.accountValidationResult,
        fileName: req.file?.originalname,
        FILE_UPLOAD_FIELD_NAME: FILE_UPLOAD_FIELD_NAME,
        errorMessage: errorMessage,
        callback: req.query.callback,
        backUrl: req.query.backUrl ?? Urls.BASE,
        submitUrl: submitUrl
    });
}


function checkPackageTypeIsUsedCorrectly(packageType: string| undefined): void {
    // IS "packageType=[anything]" present AND type is not valid -> fail
    if (isValidatedPackageTypePresent(packageType) && !PackageType.includes(packageType)){
        logger.error(`An invalid package type has been entered. Does not match any of the validate type allowed.`);
        throw new Error("Invalid package type");
    }
}

function isValidatedPackageTypePresent(packageType: string| undefined): boolean {
    return packageType !== undefined;
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

    logger.debug(`Submitting file to account-validator-api for validation. File name ${req.file?.filename}`);
    // We know the file is not undefined since if the validation did not succeed we wouldn't have made it to this point
    req.accountValidationResult = await accountValidatorService.submit(
        req.file!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        req.query?.packageType as PackageType|undefined,
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
    timeout(UI_UPDATE_TIMEOUT_MS),
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
