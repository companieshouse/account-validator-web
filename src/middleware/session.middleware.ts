import { SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler";
import { COOKIE_DOMAIN, COOKIE_NAME, COOKIE_SECRET } from "../config";
import { PACKAGE_TYPE_KEY } from "../constants";
import { NextFunction, Request, Response } from "express";

export const COOKIE_CONFIG = {
    cookieDomain: COOKIE_DOMAIN,
    cookieName: COOKIE_NAME,
    cookieSecret: COOKIE_SECRET,
    cookieSecureFlag: undefined,
    cookieTimeToLiveInSeconds: undefined
};

// export const createSessionMiddleware = (sessionStore: SessionStore) => SessionMiddleware(COOKIE_CONFIG, sessionStore, true);

export const createSessionMiddleware = (sessionStore: SessionStore) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string| undefined;

        console.log('NSDBG SM enter url: ' + req.originalUrl);
        //if (packageType === undefined || packageType.trim().length === 0) {
        //    next();
        //    console.log('NSDBG SM no pkg return');
        //    return;
        //}

        console.log('NSDBG SM session contents: ' + JSON.stringify(req.session));
        console.log('NSDBG SM Session Store: ' + JSON.stringify(sessionStore));
        console.log("NSDBG Request Cookies:", req.cookies);

        console.log("NSDBG SM normal return");
        // Does not create session if no packageType (currently)
        return SessionMiddleware(COOKIE_CONFIG, sessionStore, true)(req, res, next);
    };
};
