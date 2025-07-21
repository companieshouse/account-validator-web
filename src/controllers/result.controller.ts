import { Response, Request, Router } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates, errorMessage } from "../constants";
import { handleErrors } from "../middleware/error.handler";

export const resultController = Router({ mergeParams: true });

async function renderResultsPage(req: Request, res: Response) {
    const fileId = req.params["id"];

    const accountValidationResult = await accountValidatorService.check(fileId);
    if (accountValidationResult.status === "error") {
        throw `Error validating file. Redirecting to error handler.`;
    }

    // TEMPORARY: Decoding filename to show in the UI. Decodes encoding done in AccountValidator.uploadToS3.
    // TODO: Remove once file-transfer-service handles encoding on its end
    accountValidationResult.fileName = decodeURIComponent(accountValidationResult.fileName);

    return res.render(Templates.RESULT, {
        fileId: fileId,
        templateName: Templates.RESULT,
        accountValidationResult: accountValidationResult,
        errorMessage: errorMessage
    });
}

resultController.get("/", handleErrors(renderResultsPage));
