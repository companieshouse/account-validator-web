/**
 * Gets an environment variable. If the env var is not set and a default value is not
 * provided, then it is assumed it is a mandatory requirement and an error will be
 * thrown.
 */

import { parseDuration, parseFileSize } from "./parser";

export const getEnvironmentVariable = (key: string, defaultValue?: any): string => {
    const isMandatory = defaultValue === undefined;
    const value: string = process.env[key] || "";

    if (!value && isMandatory) {
        throw new Error(`Please set the environment variable "${key}"`);
    }

    return value || (defaultValue as string);
};

export const API_URL = getEnvironmentVariable("API_URL");
export const CACHE_SERVER = getEnvironmentVariable("CACHE_SERVER");
export const CDN_HOST = getEnvironmentVariable("CDN_HOST");
export const CHS_API_KEY = getEnvironmentVariable("CHS_API_KEY");
export const CHS_URL = getEnvironmentVariable("CHS_URL");
export const COOKIE_DOMAIN = getEnvironmentVariable("COOKIE_DOMAIN");
export const COOKIE_NAME = getEnvironmentVariable("COOKIE_NAME");
export const COOKIE_SECRET = getEnvironmentVariable("COOKIE_SECRET");
export const INTERNAL_API_URL = getEnvironmentVariable("INTERNAL_API_URL");
export const CHS_INTERNAL_API_KEY = getEnvironmentVariable(
    "CHS_INTERNAL_API_KEY"
);
export const PORT = parseInt(getEnvironmentVariable("NODE_PORT", 3000));
export const RESULT_RELOAD_DURATION_SECONDS = Number.parseFloat(
    getEnvironmentVariable("RESULT_RELOAD_DURATION_SECONDS", 5)
);
export const SURVEY_LINK = getEnvironmentVariable("SURVEY_LINK", "");
export const NUNJUCKS_RELOAD = getEnvironmentVariable("NUNJUCKS_RELOAD", "0") === '1';
export const SIGN_OUT = getEnvironmentVariable("SIGN_OUT_URL", "/signout");
export const PIWIK_URL = getEnvironmentVariable("PIWIK_URL");
export const PIWIK_SITE_ID = getEnvironmentVariable("PIWIK_SITE_ID");
export const FILE_TRANSFER_API_URL = getEnvironmentVariable("FILE_TRANSFER_API_URL");

export const MAX_FILE_SIZE = parseFileSize(
    getEnvironmentVariable("ACCOUNT_VALIDATOR_MAX_FILE_SIZE", "30MB")
);

export const MAX_FILE_SIZE_MB = Math.round(MAX_FILE_SIZE / 1024 / 1024);


export const UI_UPDATE_TIMEOUT_MS = parseDuration(
    getEnvironmentVariable("ACCOUNT_VALIDATOR_UI_UPDATE_TIMEOUT", "15m")
);

export const UI_UPDATE_INTERVAL_MS = parseDuration(
    getEnvironmentVariable("ACCOUNT_VALIDATOR_UI_UPDATE_INTERVAL", "10s")
);

export const MAX_API_CALL_RETRIES = getEnvironmentVariable("MAX_API_CALL_RETRIES", 3);
export const API_CALL_RETRY_DELAY_MS = getEnvironmentVariable("API_CALL_RETRY_DELAY_MS", 1000);
