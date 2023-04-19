export enum Templates {
    START = "start/start",
    ERROR = "error/service-offline",
    STATUS = "start/status",
    RESULT = "result/result"
}

export enum Urls {
    BASE = "/xbrl_validate",
    RENDER = `/xbrl_validate/render`,
}

export const AllowedRenderExtensions = ['xhtml', 'ixbrl'];
