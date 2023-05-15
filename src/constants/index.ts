export enum Templates {
    START = "start/start",
    SUBMIT = "submit/submit",
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
    SUBMIT_SUFFIX = "/submit",
    SUBMIT = "/xbrl_validate/submit",
    RESULT_SUFFIX = "/result",
    RESULT = "/xbrl_validate/result",
    HEALTH_CHECK_SUFFIX = "/healthcheck",
    HEALTH_CHECK = "/xbrl_validate/healthcheck",
}
