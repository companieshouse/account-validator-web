import { SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler";
import { COOKIE_DOMAIN, COOKIE_NAME, COOKIE_SECRET } from "../config";


export const COOKIE_CONFIG = {
    cookieDomain: COOKIE_DOMAIN,
    cookieName: COOKIE_NAME,
    cookieSecret: COOKIE_SECRET,
    cookieSecureFlag: undefined,
    cookieTimeToLiveInSeconds: undefined
};


export const sessionMiddleware = (sessionStore: SessionStore) => SessionMiddleware(COOKIE_CONFIG, sessionStore, true);
