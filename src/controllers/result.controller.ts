import { Response, Request, Router } from "express";
import { accountValidatorService } from "../services/account.validation.service";
import { Templates } from "../constants";
import { handleErrors } from "../middleware/error.handler";
import { RESULT_RELOAD_DURATION_SECONDS } from "../config";
import SSE from "express-sse";

const sse: SSE = new SSE();

export const resultController = Router({ mergeParams: true });

async function renderResultsPage(req: Request, res: Response) {
    const fileId = req.params['id'];

    const accountValidationResult = await accountValidatorService.check(fileId);

    try {
        setInterval(async () => {
            sse.send({ message: await accountValidatorService.check(fileId) });
        }, 10000);
    } catch (e){
        sse.dropIni();
    }

    return res.render(Templates.RESULT, {
        fileId: fileId,
        templateName: Templates.RESULT,
        resultReloadDurationSeconds: RESULT_RELOAD_DURATION_SECONDS,
        accountValidationResult: accountValidationResult
    });
}

resultController.get('/', handleErrors(renderResultsPage));
resultController.get('/sse', (req, res) => {
    sse.init(req, res);
});
