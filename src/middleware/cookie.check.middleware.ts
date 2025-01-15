import { EnsureSessionCookiePresentMiddleware } from "@companieshouse/node-session-handler";
import { COOKIE_CONFIG } from "./session.middleware";
import { PACKAGE_TYPE_KEY } from "../constants";
import { Request, Response, NextFunction } from "express";



export const cookieCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {

    const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string| undefined;

    if (packageType === undefined || packageType.trim().length === 0) {
        next();
        return;
    }

    return EnsureSessionCookiePresentMiddleware(COOKIE_CONFIG)(req, res, next);
};
