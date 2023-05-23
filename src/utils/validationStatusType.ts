export enum ValidationStatusType {
    OK = 100,
    FAILED = 0,
    ERROR = 0,
    UPLOADED_TO_FTS = 25,
    DOWNLOADED_FROM_FTS = 35,
    SENT_TO_VIRUS_SCANNER = 55,
    SENT_TO_TNDP = 75
}

export const ValidationStatusTypeString = (type: ValidationStatusType): string => {
    return ValidationStatusType[type];
};
