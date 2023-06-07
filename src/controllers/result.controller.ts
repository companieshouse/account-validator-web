import { Response, Request, Router } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates } from "../constants";
import { handleErrors } from "../middleware/error.handler";
import { RESULT_RELOAD_DURATION_SECONDS, UI_UPDATE_INTERVAL_SECONDS, UI_UPDATE_TIMEOUT_SECONDS } from "../config";
import SSE from "express-sse";
import { logger } from "../utils/logger";

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
        resultReloadDurationSeconds: RESULT_RELOAD_DURATION_SECONDS,
        accountValidationResult: accountValidationResult
    });
}

resultController.get("/", handleErrors(renderResultsPage));

resultController.get(`/sse`, (req, res) => {
    const fileId = req.params["id"];

    let uiUpdateInterval: NodeJS.Timer | undefined = undefined;
    let uiTimeoutHandler: NodeJS.Timeout | undefined = undefined;

    const cleanupHandles = () => {
        clearInterval(uiUpdateInterval);
        clearTimeout(uiTimeoutHandler);
    };

    const sse = new SSE();
    sse.init(req, res);

    req.on('close', () => {
        logger.trace("Request now closed");
        cleanupHandles();
    });

    try {
        uiUpdateInterval = setInterval(async () => {
            const accountValidationResult = await accountValidatorService.check(fileId);

            sse.send({ message: accountValidationResult });
            if (accountValidationResult.percent === 100){
                cleanupHandles();
            }
        }, UI_UPDATE_INTERVAL_SECONDS * 1000);

        uiTimeoutHandler = setTimeout(() => {
            logger.error(`UI update timeout reached. Closing SSE for file [${fileId}].`);
            clearInterval(uiUpdateInterval);
        }, UI_UPDATE_TIMEOUT_SECONDS * 1000);
    } catch (e) {
        sse.send({ message: { percent: 100 } });
        sse.dropIni();
        cleanupHandles();
    }
});
