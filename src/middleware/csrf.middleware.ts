import { NextFunction, Request, Response } from "express";
import { CsrfError, CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { SessionStore } from "@companieshouse/node-session-handler";
import { COOKIE_NAME } from "../config";

export const csrfErrorTemplateName = "csrf-error";

export const csrfErrorHandler = (
    err: CsrfError | Error,
    _: Request,
    res: Response,
    next: NextFunction
) => {
    if (!(err instanceof CsrfError)) {
        return next(err);
    }

    return res.status(403).render(csrfErrorTemplateName, {
        csrfErrors: true,
    });
};


export const createCsrfProtectionMiddleware = (sessionStore: SessionStore) => CsrfProtectionMiddleware({
    sessionStore: sessionStore,
    enabled: true,
    sessionCookieName: COOKIE_NAME
});
