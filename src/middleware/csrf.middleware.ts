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

export const createCsrfProtectionMiddleware = (sessionStore: SessionStore) => {
    console.log('NSDBG CSRF enter/return sessionStore: ' + sessionStore);
    const csrfMiddleware = CsrfProtectionMiddleware({
        sessionStore: sessionStore,
        enabled: true,
        sessionCookieName: COOKIE_NAME
    });

    return (req, res, next) => {
        console.log(`NSDBG CSRF middleware called for ${req.path}`);
        console.log('NSDBG before CSRF middleware - session: ' + JSON.stringify(req.session));
        csrfMiddleware(req, res, () => {
            console.log('NSDBG after CSRF middleware session contents: ' + JSON.stringify(req.session));
            console.log('NSDBG CSRF token in res.locals after middleware for ' + req.path + ': ' + res.locals._csrf);
            if (!res.locals._csrf) {
                console.log('NSDBG Manually generating CSRF token');
                res.locals._csrf = req.csrfToken ? req.csrfToken() : 'MISSING_CSRF_TOKEN';
            }
            console.log('NSDBG CSRF token after manual generation: ' + res.locals._csrf);
            next();
        });
    };
    //return CsrfProtectionMiddleware({
    //    sessionStore: sessionStore,
    //    enabled: true,
    //    sessionCookieName: COOKIE_NAME
    //});
};

//export const createCsrfProtectionMiddleware = (sessionStore: SessionStore) => CsrfProtectionMiddleware({
//    sessionStore: sessionStore,
//    enabled: true,
//    sessionCookieName: COOKIE_NAME
//});
