import { Response, Router, Request } from "express";
import { handleErrors } from "../middleware/error.handler";
import { logger } from "../utils/logger";

export const healthCheckController = Router({ mergeParams: true });

async function healthCheck(req: Request, res: Response) {
    logger.debug(`health check triggered`);
    await Promise.resolve(res.sendStatus(200));
}

healthCheckController.get('/', handleErrors(healthCheck));
