/**
 * Gets an environment variable. If the env var is not set and a default value is not
 * provided, then it is assumed it is a mandatory requirement and an error will be
 * thrown.
 */

const getEnvironmentVariable = (key: string, defaultValue?: any): string => {
    const isMandatory = !defaultValue;
    const value: string = process.env[key] || "";

    if (!value && isMandatory) {
        throw new Error(`Please set the environment variable "${key}"`);
    }

    return value || (defaultValue as string);
};

export const COOKIE_NAME = getEnvironmentVariable("COOKIE_NAME");

export const COOKIE_DOMAIN = getEnvironmentVariable("COOKIE_DOMAIN");

export const COOKIE_SECRET = getEnvironmentVariable("COOKIE_SECRET");

export const CACHE_SERVER = getEnvironmentVariable("CACHE_SERVER");

export const CHS_API_KEY = getEnvironmentVariable("CHS_API_KEY");

export const CHS_URL = getEnvironmentVariable("CHS_URL");

export const API_URL = getEnvironmentVariable("API_URL");

export const INTERNAL_API_URL = getEnvironmentVariable("INTERNAL_API_URL");

export const PORT = parseInt(getEnvironmentVariable("PORT", 3000));
