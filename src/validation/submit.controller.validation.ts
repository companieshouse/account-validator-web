import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "../config";
import { ErrorMessages, FILE_UPLOAD_FIELD_NAME } from "../constants";
import { ValidationResult } from "./validation.result";

export interface FileMetaData {
    size: number
    firstBytes: string
}

export interface SubmittedFileValidationRequest {
    file: FileMetaData | null;
}

export function isFileMetaData(obj: any): obj is FileMetaData {
    return obj !== null
        && typeof obj === 'object'
        && typeof obj.size === 'number'
        && typeof obj.firstBytes === 'string';
}

export function isSubmittedFileValidationRequest(obj: any): obj is SubmittedFileValidationRequest {
    return obj !== null
        && typeof obj === 'object'
        && (obj.file === null || isFileMetaData(obj.file));
}

function isZipFile(firstBytes: string): boolean {
    const ZIP_MAGIC_NUMBER = "PK\u0003\u0004";
    return firstBytes.startsWith(ZIP_MAGIC_NUMBER);
}

function isHTMLFile(firstBytes: string): boolean {
    const htmlPattern = /^\s*<html/i;
    return htmlPattern.test(firstBytes);
}

function isXMLFile(firstBytes: string) {
    const xmlPattern: RegExp = /^\s*<\?xml/i;
    return xmlPattern.test(firstBytes);
}

function isValidFileType(firstBytes: string): boolean {
    return isHTMLFile(firstBytes) || isXMLFile(firstBytes) || isZipFile(firstBytes);
}

function isTooLarge(fileSize: number): boolean {
    return fileSize > MAX_FILE_SIZE;
}

export function validateRequest(req: SubmittedFileValidationRequest): ValidationResult {
    const validationResult = new ValidationResult();

    if (req.file === null) {
        validationResult.addError(FILE_UPLOAD_FIELD_NAME, ErrorMessages.NO_FILE);
        return validationResult;
    }

    if (!isValidFileType(req.file.firstBytes)) {
        validationResult.addError(FILE_UPLOAD_FIELD_NAME, ErrorMessages.INVALID_FILE_TYPE);
    }

    if (isTooLarge(req.file.size)) {
        validationResult.addError(FILE_UPLOAD_FIELD_NAME, ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
    }

    return validationResult;
}
