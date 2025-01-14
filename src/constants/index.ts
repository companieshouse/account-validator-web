export enum Templates {
    START = "start/start",
    SUBMIT = "submit/submit",
    SUBMIT_PACKAGE_ACCOUNT = "submit/submit-package-account",
    ERROR = "error/service-offline",
    STATUS = "start/status",
    RESULT = "result/result",
}

// The URLs in this enum are duplicated because string enums need to be constant initialized.
// You can read more about it in the official TypeScript documentation:
// https://www.typescriptlang.org/docs/handbook/enums.html#string-enums
export enum Urls {
    BASE = "/xbrl_validate",
    RENDER = `/xbrl_validate/render`,
    SUBMIT_SUFFIX = "/submit-accounts",
    SUBMIT = "/xbrl_validate/submit-accounts",
    SUBMIT_PACKAGE_SUFFIX = "/submit",
    SUBMIT_PACKAGE = "/xbrl_validate/submit",
    SUBMIT_VALIDATE_SUFFIX = "/submit/validate",
    SUBMIT_VALIDATE = "/xbrl_validate/submit/validate",
    RESULT_SUFFIX = "/result",
    RESULT = "/xbrl_validate/result",
    PROGRESS = "/xbrl_validate/progress",
    PROGRESS_SUFFIX = "/progress",
    HEALTH_CHECK_SUFFIX = "/healthcheck",
    HEALTH_CHECK = "/xbrl_validate/healthcheck",
    ERROR = "/xbrl_validate/error",
    ERROR_SUFFIX = "/error"
}

export const errorMessage = "timeout";

export const ErrorMessages = {
    INVALID_FILE_TYPE: "The selected file must be a XHTML or ZIP.",
    NO_FILE: "Select an accounts file.",
    FILE_TOO_LARGE: (MAX_FILE_SIZE_MB: number) => `The selected file must be smaller than ${MAX_FILE_SIZE_MB}MB`,
};

export const FILE_UPLOAD_FIELD_NAME = "file";

export const PACKAGE_TYPE_KEY = "packageType";
