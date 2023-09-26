import { Response, Request } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { errorMessage } from "../constants";
import { logger } from "../utils/logger";
import { UI_UPDATE_INTERVAL_MS, UI_UPDATE_TIMEOUT_MS } from "../config";
import { SSEManager } from "../utils/sseManager";

export function handleUIUpdates(req: Request, res: Response) {
    const fileId = req.params["id"];

    let uiUpdateInterval: NodeJS.Timer | undefined = undefined;
    let uiTimeoutHandler: NodeJS.Timeout | undefined = undefined;

    const cleanupHandles = () => {
        clearInterval(uiUpdateInterval as number | undefined);
        clearTimeout(uiTimeoutHandler);
    };

    const sse = new SSEManager(res);

    req.on('close', () => {
        logger.trace("Request now closed");
        cleanupHandles();
    });

    uiUpdateInterval = setInterval(async () => {
        try {
            const accountValidationResult = await accountValidatorService.check(fileId);

            sse.send({ message: accountValidationResult });
            
            if (accountValidationResult.percent === 100) {
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
