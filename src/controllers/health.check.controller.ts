import { Response, Router, Request } from "express";
import { logger } from "../utils/logger";

export const healthCheckController = Router({ mergeParams: true });

function healthCheck(req: Request, res: Response) {
    logger.traceRequest(req, "Healthcheck triggered.");
    return res.sendStatus(200);
}

healthCheckController.get('/', healthCheck);
