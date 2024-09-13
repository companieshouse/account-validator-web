import { Response, Router, Request } from "express";

export const healthCheckController = Router({ mergeParams: true });

function healthCheck(req: Request, res: Response) {
    return res.sendStatus(200);
}

healthCheckController.get('/', healthCheck);
