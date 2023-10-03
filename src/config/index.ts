/**
 * Gets an environment variable. If the env var is not set and a default value is not
 * provided, then it is assumed it is a mandatory requirement and an error will be
 * thrown.
 */

const getEnvironmentVariable = (key: string, defaultValue?: any): string => {
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
export const NODE_PORT = parseInt(getEnvironmentVariable("NODE_PORT", 3000));
export const RESULT_RELOAD_DURATION_SECONDS = parseFloat(
    getEnvironmentVariable("RESULT_RELOAD_DURATION_SECONDS", 5)
);
export const SURVEY_LINK = getEnvironmentVariable("SURVEY_LINK", "");

/**
 * Parses a file size string and returns the equivalent number of bytes.
 *
 * @param size The file size string to parse. Must be in the format "X[B|KB|MB|GB|TB]", where X is a positive decimal number and the optional unit (B, KB, MB, GB, or TB) indicates the size in bytes, kilobytes, megabytes, gigabytes, or terabytes, respectively.
 * @returns The equivalent number of bytes.
 * @throws {Error} If the file size string is invalid or cannot be parsed.
 */
function parseFileSize(size: string): number {
    const units = ["B", "KB", "MB", "GB", "TB"];
    const regex = new RegExp(`^(\\d*\\.?\\d*)(${units.join("|")})$`, "i");
    const matches = size.match(regex);
    if (!matches) {
        throw new Error(
            `Error parsing file size "${size}". File size must be a positive decimal number followed by one of the following units: B, KB, MB, GB, TB (e.g. "123MB").`
        );
    }

    const [, value, unit] = matches;
    const unitIndex = units.indexOf(unit.toUpperCase());
    return Math.round(Number(value) * Math.pow(1024, unitIndex));
}

export const MAX_FILE_SIZE = parseFileSize(
    getEnvironmentVariable("ACCOUNT_VALIDATOR_MAX_FILE_SIZE", "30MB")
);

export const MAX_FILE_SIZE_MB = Math.round(MAX_FILE_SIZE / 1024 / 1024);

/**
 * Parse a duration string into milliseconds.
 * The string can include hours (h), minutes (m), and seconds (s), like "1h", "2m 5s", "15m", "1h34m".
 * This function will return the total duration in milliseconds.
 *
 * @param duration - The duration string to parse.
 * @returns The duration in milliseconds.
 */
function parseDuration(duration: string): number {
    const durationRegex = /(\d+)(h|m|s)/g;
    let match: RegExpExecArray | null;
    let milliseconds = 0;

    let iterations = 0;
    const maxIterations = 10; // Bound the loop to stop infinite looping.

    while ((match = durationRegex.exec(duration)) !== null) {
        if (++iterations > maxIterations) {
            throw new Error(`Error parsing duration string [${duration}]. Maximum iterations reached.`);
        }

        const value = Number(match[1]);
        const unit = match[2];

        switch (unit) {
                case "h":
                    milliseconds += value * 60 * 60 * 1000;
                    break;
                case "m":
                    milliseconds += value * 60 * 1000;
                    break;
                case "s":
                    milliseconds += value * 1000;
                    break;
        }
    }

    return milliseconds;
}


export const UI_UPDATE_TIMEOUT_MS = parseDuration(
    getEnvironmentVariable("ACCOUNT_VALIDATOR_UI_UPDATE_TIMEOUT", "15m")
);

export const UI_UPDATE_INTERVAL_MS = parseDuration(
    getEnvironmentVariable("ACCOUNT_VALIDATOR_UI_UPDATE_INTERVAL", "10s")
);
