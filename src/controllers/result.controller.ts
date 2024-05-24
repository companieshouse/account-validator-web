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

    return res.render(Templates.RESULT, {
        fileId: fileId,
        templateName: Templates.RESULT,
        accountValidationResult: accountValidationResult,
        errorMessage: errorMessage
    });
}

resultController.get("/", handleErrors(renderResultsPage));
