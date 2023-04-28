import { Response, Router, Request } from "express";
import { logger } from "../utils/logger";

export const healthCheckController = Router({ mergeParams: true });

function healthCheck(req: Request, res: Response) {
    logger.debug(`health check triggered`);
    return res.sendStatus(200);
}

healthCheckController.get('/', healthCheck);
