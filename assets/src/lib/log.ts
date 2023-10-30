export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3, 
};

declare global {
    interface Window {
        accountValidatorLogLevel: number;
    }
}

export function log(level: number, message: string): void {
    if (level <= window.accountValidatorLogLevel) {
        const timestamp = new Date().toISOString();
        let levelStr = '';
        switch(level) {
            case LOG_LEVELS.ERROR:
                levelStr = 'ERROR';
                break;
            case LOG_LEVELS.WARN:
                levelStr = 'WARN';
                break;
            case LOG_LEVELS.INFO:
                levelStr = 'INFO';
                break;
            case LOG_LEVELS.DEBUG:
                levelStr = 'DEBUG';
                break;
            default:
                levelStr = 'UNKNOWN';
                break;
        }

        if (level === LOG_LEVELS.ERROR) {
            console.error(`${timestamp} [${levelStr}]: ${message}`);
        } else {
            console.log(`${timestamp} [${levelStr}]: ${message}`);
        }
    }
}
