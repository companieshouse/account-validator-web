import { Response, Request, Router } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates } from "../constants";
import { handleErrors } from "../middleware/error.handler";
import { RESULT_RELOAD_DURATION_SECONDS, UI_UPDATE_INTERVAL_SECONDS } from "../config";
import SSE from "express-sse";
import { logger } from "../utils/logger";

export const resultController = Router({ mergeParams: true });

async function renderResultsPage(req: Request, res: Response) {
    const fileId = req.params["id"];

    const accountValidationResult = await accountValidatorService.check(fileId);

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

    const sse = new SSE();
    sse.init(req, res);

    req.on('close', () => {
        logger.info("Request now closed");
    });

    try {
        const interval = setInterval(async () => {
            const accountValidationResult = await accountValidatorService.check(fileId);

            sse.send({ message: accountValidationResult });
            if (accountValidationResult.percent === 100){
                clearInterval(interval);
                res.set("Connection", "close");
            }

        }, UI_UPDATE_INTERVAL_SECONDS * 1000);
    } catch (e){
        sse.dropIni();
    }
});
