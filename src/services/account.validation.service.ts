import { Resource } from "@companieshouse/api-sdk-node";
import { AccountValidatorResponse } from "private-api-sdk-node/dist/services/account-validator/types";
import { createPrivateApiKeyClient } from "./api.service";
import PrivateApiClient from "private-api-sdk-node/dist/client";
import { File, Id } from "private-api-sdk-node/dist/services/file-transfer/types";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";

/**
 * Interface representing the account validation service
 */
export interface AccountValidationService {
    /**
     * Submit a file for validation
     * @param file The file to be validated
     * @returns Promise<AccountValidationResult> The result of the validation
     */
    submit(file: Express.Multer.File): Promise<AccountValidationResult>;

    /**
     * Check the status of a validation request
     * @param id The id of the validation request
     * @returns Promise<AccountValidationResult> The result of the validation
     */
    check(id: string): Promise<AccountValidationResult>;
}

interface ValidationResultCommon {
    /** The id of the file */
    fileId: string;
    /** The name of the file */
    fileName: string;
}

/**
 * Interface representing a successful validation result
 */
interface SuccessValidationResult extends ValidationResultCommon {
    /** The status of the validation result */
    status: "success";
    /** The URL of the image */
    imageUrl?: string;
}

/**
 * Interface representing a failed validation result
 */
interface FailureValidationResult extends ValidationResultCommon {
    /** The status of the validation result */
    status: "failure";
    /** The reasons for the failure */
    reasons: string[];

}

/**
 * Interface representing a pending validation result
 */
interface PendingValidationResult extends ValidationResultCommon {
    /** The status of the validation result */
    status: "pending";
}

/**
 * Type representing the possible validation results
 */
export type AccountValidationResult =
    | SuccessValidationResult
    | FailureValidationResult
    | PendingValidationResult;

/**
 * Map the response type from the API to the `AccountValidationResult` type
 * @param accountValidatorResource The response from the API
 * @returns AccountValidationResult The mapped validation result
 */
export function mapResponseType(
    accountValidatorResource: Resource<AccountValidatorResponse>
): AccountValidationResult {
    const accountValidatorResponse = (
        accountValidatorResource as Resource<AccountValidatorResponse>
    ).resource;
    if (accountValidatorResponse === undefined) {
        throw new Error(
            `Resource inside accountValidatorResource is undefined. ` +
                `This shouldn't happen. ` +
                `It means the response body from the http request was also undefined.`
        );
    }

    const baseResult = {
        fileId: accountValidatorResponse.fileId,
        fileName: accountValidatorResponse.fileName,
    };

    if (accountValidatorResponse.status === "pending") {
        return {
            status: "pending",
            ...baseResult
        };
    }

    const result = accountValidatorResponse.result;
    switch (result.validationStatus) {
            case "OK":
                return {
                    status: "success",
                    ...baseResult
                };
            case "FAILED":
                return {
                    status: "failure",
                    reasons: result.errorMessages,
                    ...baseResult
                };
    }
}

/**
 * Class representing the AccountValidator.  The validation is performed by
 * making API calls to the `account-validator-api`.
 */
export class AccountValidator implements AccountValidationService {
    /**
     * Constructor for the AccountValidator class
     * @param apiClient The API client to use for making requests. This parameter is for dependency injection.
     * The default value is automatically configured from the environment.
     */
    constructor(
        private privateApiClient: PrivateApiClient = createPrivateApiKeyClient(),
    ) {}

    /**
     * Check the status of a validation request
     * @param id The id of the validation request
     * @returns Promise<AccountValidationResult> The result of the validation
     * @throws If the API returns a non-200 status code, the returned value is an instance of `ApiErrorResponse`
     */
    async check(id: string): Promise<AccountValidationResult> {
        const accountValidatorService = this.apiClient.accountValidatorService;
        const accountValidatorResponse =
            await accountValidatorService.getFileValidationStatus(id);
        if (accountValidatorResponse.httpStatusCode !== 200) {
            throw accountValidatorResponse; // If the status code is not 200, the return type is ApiErrorResponse
        }

        return mapResponseType(
            accountValidatorResponse as Resource<AccountValidatorResponse>
        );
    }

    /**
     * Submit a file for validation
     * @param file The file to be validated
     * @returns Promise<AccountValidationResult> The result of the validation
     * @throws If the API returns a non-200 status code, the returned value is an instance of `ApiErrorResponse`
     */
    async submit(file: Express.Multer.File): Promise<AccountValidationResult> {

        const fileId = (await this.uploadToS3(file)) as Resource<Id>;

        if (fileId.resource?.id) {

            const requestPayload = { fileName: file.originalname, id: fileId.resource?.id };
            const accountValidatorService = this.apiClient.accountValidatorService;

            const accountValidatorResponse =
                await accountValidatorService.postFileForValidation(requestPayload);

            if (accountValidatorResponse.httpStatusCode !== 200) {
                throw accountValidatorResponse; // If the status code is not 200, the return type is ApiErrorResponse
            }

            return mapResponseType(
                accountValidatorResponse as Resource<AccountValidatorResponse>
            );
        } else {
            throw new Error('Upload to S3 failed: no file id returned');
        }
    }

    /**
     * Upload the file to S3 using the File Transfer Service (FTS)
     * @param file The file to be uploaded
     * @returns string The id of the uploaded file
     */
    private async uploadToS3(file: Express.Multer.File): Promise<Resource<Id> | ApiErrorResponse>{

        // TODO: Change body type to string
        const fileDetails: File =  { fileName: file.originalname, body: file.buffer.toString("base64"), mimeType: file.mimetype, size: file.size, extension: '.xtml' };

        const fileTransferService = this.privateApiClient.fileTransferService;
        const fileId = await fileTransferService.upload(fileDetails);
        return fileId;
    }


}

export const accountValidatorService = new AccountValidator();
