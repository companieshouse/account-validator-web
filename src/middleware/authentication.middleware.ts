import { NextFunction, Request, Response } from "express";
import { authMiddleware, AuthOptions } from "@companieshouse/web-security-node";
import { CHS_URL } from "../config";
import { PACKAGE_TYPE_KEY } from "../constants";

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log("NSDBG AM");
    const authMiddlewareConfig: AuthOptions = {
        chsWebUrl: CHS_URL,
        returnUrl: req.originalUrl
    };

    const packageType: string | undefined = req.query?.[PACKAGE_TYPE_KEY] as string| undefined;

    if (packageType === undefined || packageType.trim().length === 0) {
        next();
        return;
    }

    return authMiddleware(authMiddlewareConfig)(req, res, next);
};
