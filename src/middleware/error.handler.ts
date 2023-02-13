import { Handler, NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { Templates } from "../types/template.paths";

/**
 * Error handling middleware so that any un-caught exceptions will show an error screen.
 *
 * Note: async handlers need to be wrapped with the handlerErrors function
 * @param error
 * @param _req
 * @param _next
 * @param res
 */
export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
    const stackMsg = error.stack ? `Stack: ${error.stack}` : '';
    logger.error(`Unhandled error: ${JSON.stringify(error)} ${stackMsg}`,);

    res.status(500).render(Templates.ERROR, {
        error: JSON.stringify(error, null, 2)
    });
}

/**
 * Wraps an async handler and passes the error on down the chain of handlers.
 *
 * @param fn the handler to be wrapped
 * @returns a new handler that will catch exceptions
 */
export function handleErrors(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): Handler {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (e) {
            // Pass the error down the chain
            next(e);
        }
    };
}
