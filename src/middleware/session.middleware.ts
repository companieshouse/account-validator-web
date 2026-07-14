import { SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler";
import { CACHE_SERVER, COOKIE_DOMAIN, COOKIE_NAME, COOKIE_SECRET } from "../config";
import { NextFunction, Request, Response } from "express";
import Redis from "ioredis";


export const COOKIE_CONFIG = {
    cookieDomain: COOKIE_DOMAIN,
    cookieName: COOKIE_NAME,
    cookieSecret: COOKIE_SECRET,
    cookieSecureFlag: undefined,
    cookieTimeToLiveInSeconds: undefined
};

const setupSessionStore = () => {
    const redis = new Redis(`redis://${CACHE_SERVER}`);
    return new SessionStore(redis);
};

const sessionStore = setupSessionStore();

export const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    return SessionMiddleware(COOKIE_CONFIG, sessionStore, true)(req, res, next);
};
