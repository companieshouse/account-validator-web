export const ValidationStatusPercents = {
    OK: 100,
    FAILED: 100,
    ERROR: 100,
    UPLOADED_TO_FTS: 25,
    DOWNLOADED_FROM_FTS: 35,
    SENT_TO_VIRUS_SCANNER: 55,
    SENT_TO_TNDP: 75
};

export enum ValidationStatusType {
    OK = "OK",
    FAILED = "FAILED",
    ERROR = "ERROR",
    UPLOADED_TO_FTS = "UPLOADED_TO_FTS",
    DOWNLOADED_FROM_FTS = "DOWNLOADED_FROM_FTS",
    SENT_TO_VIRUS_SCANNER = "SENT_TO_VIRUS_SCANNER",
    SENT_TO_TNDP = "SENT_TO_TNDP"
}

