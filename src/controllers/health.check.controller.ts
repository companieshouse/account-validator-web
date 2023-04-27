import { Response, Router } from "express";
import { logger } from "../utils/logger";

export const healthCheckController = Router({ mergeParams: true });

function healthCheck(res: Response) {
    logger.debug(`health check triggered`);
    return res.sendStatus(200);
}

healthCheckController.get('/', healthCheck);
