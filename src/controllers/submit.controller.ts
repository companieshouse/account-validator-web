import { Response, Request, Router, NextFunction } from "express";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, UI_UPDATE_INTERVAL_MS, UI_UPDATE_TIMEOUT_MS } from "../config";
import { ErrorMessages, FILE_UPLOAD_FIELD_NAME, Templates, errorMessage, Urls, PACKAGE_TYPE_KEY } from "../constants";
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
import { isPackageType, PackageType } from "@companieshouse/api-sdk-node/dist/services/accounts-filing/types";

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
    const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string | undefined;
    const sessionPackageType: string | undefined = req.session?.getExtraData<string>(PACKAGE_TYPE_KEY);

    if (packageType !== undefined && packageType?.toLowerCase() !== sessionPackageType?.toLowerCase()) {
        throw new Error(`Query package type does not match session package type.`);
    }

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
    let userEmail: string | undefined = undefined;
    const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string | undefined;
    if (packageType !== undefined && typeof(packageType) === "string" && packageType.trim().length > 0) {
        userEmail = req.session?.data.signin_info?.user_profile?.email;
    }

    let submitUrl;
    let submitPage;
    if (packageType !== undefined) {
        submitUrl = Urls.SUBMIT_PACKAGE + getSubmitQueryParams(req);
        submitPage = Templates.SUBMIT_PACKAGE_ACCOUNT;
    } else {
        submitUrl = Urls.SUBMIT + getSubmitQueryParams(req);
        submitPage = Templates.SUBMIT;
    }
    return res.render(submitPage, {
        templateName: submitPage,
        formValidationResult: req.formValidationResult,
        accountValidationResult: req.accountValidationResult,
        fileName: req.file?.originalname,
        FILE_UPLOAD_FIELD_NAME: FILE_UPLOAD_FIELD_NAME,
        errorMessage: errorMessage,
        callback: req.query.callback,
        backUrl: req.query.backUrl ?? Urls.BASE,
        submitUrl: submitUrl,
        pollingIntervalMS: UI_UPDATE_INTERVAL_MS,
        timeoutMS: UI_UPDATE_TIMEOUT_MS,
        sizeLimit: MAX_FILE_SIZE_MB,
        userEmail
    });
}


function validatePackageType(packageType: string| undefined): void {
    // IS "packageType=[anything]" present AND type is not valid -> fail
    if (packageType !== undefined && !isPackageType(packageType)){
        logger.error(`An invalid package type has been entered. Does not match any of the validate type allowed.`);
        throw new Error("Invalid package type");
    }
}

/**
 * Regular expression pattern for validating UK Companies House company numbers.
 *
 * This pattern matches the following formats:
 * - 8 digits for companies registered in England and Wales
 * - 2 letters followed by 6 digits for other types of registrations:
 *   SC: Scotland
 *   NI: Northern Ireland
 *   OC: LLPs in England and Wales
 *   SO: LLPs in Scotland
 *   NC: LLPs in Northern Ireland
 *   FC: Overseas companies
 *   NF: Overseas companies not required to register
 *   GE: European Economic Interest Groupings (EEIGs)
 */
const companyNumberPattern = /^(([0-9]{8})|([A-Z]{2}[0-9]{6}))$/;

function validateCompanyNumber(companyNumber: string | undefined): void {
    if (companyNumber !== undefined && !companyNumberPattern.test(companyNumber)) {
        logger.error(`An invalid company number has been entered. Does not match the required format.`);
        throw new Error("Invalid company number");
    }
}

function getSubmitQueryParams(req: Request) {
    const packageType = req.query?.packageType as string|undefined;
    validatePackageType(packageType);

    const companyNumber = req.query?.companyNumber as string|undefined;
    validateCompanyNumber(companyNumber);

    const queryParams = new URLSearchParams();

    if (packageType !== undefined) {
        queryParams.append('packageType', packageType);
    }

    if (companyNumber !== undefined) {
        queryParams.append('companyNumber', companyNumber);
    }

    if (queryParams.size === 0) {
        return '';
    }

    return `?${queryParams.toString()}`;
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

    logger.debug(`Submitting file to account-validator-api for validation. File name ${req.file?.originalname}`);
    // We know the file is not undefined since if the validation did not succeed we wouldn't have made it to this point
    req.accountValidationResult = await accountValidatorService.submit(
        req.file!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        req.query?.packageType as PackageType|undefined,
        req.query?.companyNumber as string|undefined,
    );
    logger.debug(`Response received from account-validator-api`);

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
