import { EnsureSessionCookiePresentMiddleware } from "@companieshouse/node-session-handler";
import { COOKIE_DOMAIN, COOKIE_NAME, COOKIE_SECRET } from "../config";
import { PACKAGE_TYPE_KEY } from "../constants";
import { Request, Response, NextFunction } from "express";

const COOKIE_CONFIG = {
    cookieDomain: COOKIE_DOMAIN,
    cookieName: COOKIE_NAME,
    cookieSecret: COOKIE_SECRET,
    cookieSecureFlag: undefined,
    cookieTimeToLiveInSeconds: undefined
};

export const cookieCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {

    console.log("NSDBG CM enter");
    const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string| undefined;

    //if (packageType === undefined || packageType.trim().length === 0) {
    //    next();
    //    console.log("NSDBG CM no pkg return");
    //    return;
    //}

    console.log("NSDBG CM normal return");
    return EnsureSessionCookiePresentMiddleware(COOKIE_CONFIG)(req, res, next);
};
