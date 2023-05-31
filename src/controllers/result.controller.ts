import { Response, Request, Router } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates } from "../constants";
import { handleErrors } from "../middleware/error.handler";
import { RESULT_RELOAD_DURATION_SECONDS, UI_UPDATE_INTERVAL_SECONDS } from "../config";
import SSE from "express-sse";
import { v4 as uuidv4 } from 'uuid';

const sse: SSE = new SSE();
const myuuid = uuidv4();
let closeStream: boolean;

export const resultController = Router({ mergeParams: true });

async function renderResultsPage(req: Request, res: Response) {
    const fileId = req.params["id"];

    const accountValidationResult = await accountValidatorService.check(fileId);

    try {
        const interval = setInterval(async () => {
            sse.send({ message: await accountValidatorService.check(fileId) });
            if (accountValidationResult.percent === 100){
                clearInterval(interval);
                req.on('close', () => {
                    res.end();
                    sse.dropIni();
                });
                closeStream = true;
            }
        }, UI_UPDATE_INTERVAL_SECONDS * 1000);

    } catch (e){
        sse.dropIni();
    }

    return res.render(Templates.RESULT, {
        fileId: fileId,
        templateName: Templates.RESULT,
        resultReloadDurationSeconds: RESULT_RELOAD_DURATION_SECONDS,
        accountValidationResult: accountValidationResult,
        sseId: myuuid,
    });
}

resultController.get("/", handleErrors(renderResultsPage));

resultController.get(`/sse/${myuuid}`, (req, res) => {
    sse.init(req, res);
    const sseInterval = setInterval(() => {
        if (closeStream){
            clearInterval(sseInterval);
            res.end();
        }
    }, UI_UPDATE_INTERVAL_SECONDS * 1000);


});
