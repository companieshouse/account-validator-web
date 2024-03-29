import { Response, Request, Router } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates, errorMessage } from "../constants";
import { logger } from "../utils/logger";
import { UI_UPDATE_INTERVAL_MS, UI_UPDATE_TIMEOUT_MS } from "../config";
import { SSEManager } from "../utils/sse.manager";
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

export function handleUIUpdates(req: Request, res: Response) {
    const fileId = req.params["id"];

    let uiUpdateInterval: NodeJS.Timer | undefined = undefined;
    let uiTimeoutHandler: NodeJS.Timeout | undefined = undefined;

    const cleanupHandles = () => {
        clearInterval(uiUpdateInterval as number | undefined);
        clearTimeout(uiTimeoutHandler);
    };

    const sse = new SSEManager(res);
    sse.initialize(req.socket);

    req.on('close', () => {
        logger.trace("Request now closed");
        cleanupHandles();
    });

    uiUpdateInterval = setInterval(async () => {
        try {
            const accountValidationResult = await accountValidatorService.check(fileId);

            sse.send({ message: accountValidationResult });
            if (accountValidationResult.percent === 100){
                cleanupHandles();
            }
        } catch (e) {
            logger.error(`Encountered error while updating validation progress: ${JSON.stringify(e)}`);

            sse.send({ message: errorMessage });
            cleanupHandles();
        }
    }, UI_UPDATE_INTERVAL_MS);

    uiTimeoutHandler = setTimeout(() => {
        logger.error(`UI update timeout reached. Closing SSE for file [${fileId}].`);

        sse.send({ message: errorMessage });
        cleanupHandles();
    }, UI_UPDATE_TIMEOUT_MS);
}


resultController.get(`/sse`, handleUIUpdates);
