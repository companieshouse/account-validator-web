import { Response, Router, Request } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates } from "../constants";
import { handleErrors } from "../middleware/error.handler";
import { RESULT_RELOAD_DURATION_SECONDS } from "../config";

export const resultController = Router({ mergeParams: true });

async function renderResultsPage(req: Request, res: Response) {
    const fileId = req.params['id'];

    const accountValidationResult = await accountValidatorService.check(fileId);

    return res.render(Templates.RESULT, {
        fileId: fileId,
        templateName: Templates.RESULT,
        resultReloadDurationSeconds: RESULT_RELOAD_DURATION_SECONDS,
        accountValidationResult: accountValidationResult
    });
}

resultController.get('/', handleErrors(renderResultsPage));
