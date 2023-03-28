import { Resource } from "@companieshouse/api-sdk-node";
import ApiClient from "@companieshouse/api-sdk-node/dist/client";
import { AccountValidatorResponse } from "@companieshouse/api-sdk-node/dist/services/account-validator";
import { logger } from "../utils/logger";
import { createPublicApiKeyClient, createPrivateApiKeyClient } from "./api.service";
import { performance } from "perf_hooks";
import PrivateApiClient from "private-api-sdk-node/dist/client";

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

/**
 * Interface representing a successful validation result
 */
interface SuccessValidationResult {
    /** The status of the validation result */
    status: "success";
    /** The id of the file */
    fileId: string;
    /** The URL of the image */
    imageUrl?: string;
}

/**
 * Interface representing a failed validation result
 */
interface FailureValidationResult {
    /** The status of the validation result */
    status: "failure";
    /** The id of the file */
    fileId: string;
    /** The reasons for the failure */
    reasons: string[];
}

/**
 * Interface representing a pending validation result
 */
interface PendingValidationResult {
    /** The status of the validation result */
    status: "pending";
    /** The id of the file */
    fileId: string;
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

    if (accountValidatorResponse.status === "pending") {
        return {
            status: "pending",
            fileId: accountValidatorResponse.fileId,
        };
    }

    const result = accountValidatorResponse.result;
    switch (result.validationStatus) {
            case "OK":
                return {
                    status: "success",
                    fileId: accountValidatorResponse.fileId,
                };
            case "FAILED":
                return {
                    status: "failure",
                    reasons: result.errorMessages,
                    fileId: accountValidatorResponse.fileId,
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
        private apiClient: ApiClient = createPublicApiKeyClient(),
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

        const fileTransferService = this.privateApiClient.fileTransferService;
        const fileId = this.uploadToS3;

        const requestPayload = { fileName: file.originalname, id: fileId };
        const accountValidatorService = this.apiClient.accountValidatorService;

        const accountValidatorResponse =
            await accountValidatorService.postFileForValidation(requestPayload);

        if (accountValidatorResponse.httpStatusCode !== 200) {
            throw accountValidatorResponse; // If the status code is not 200, the return type is ApiErrorResponse
        }

        return mapResponseType(
            accountValidatorResponse as Resource<AccountValidatorResponse>
        );
    }

    /**
     * Upload the file to S3 using the File Transfer Service (FTS)
     * @param file The file to be uploaded
     * @returns string The id of the uploaded file
     */
    private uploadToS3(file: Express.Multer.File): string {
        const fileId = fileTransferService.upload(file);
        return fileId;
    }
}

/**
 * Options for configuring a synchronous validator.
 */
interface SynchronousValidatorOptions {
    /**
     * The maximum time, in milliseconds, to wait for a validation request to complete before timing out.
     */
    timeoutMs: number;

    /**
     * Whether an error should be thrown if the validation request times out.
     */
    errOnTimeout: boolean;
}

/**
 * Default options for a synchronous validator.
 */
const defaultSynchronousValidatorOptions: SynchronousValidatorOptions = {
    timeoutMs: 10_000,
    errOnTimeout: true,
};

/**
 * Synchronous Account Validation Service that continuously checks the status of a validation request.
 * This implementation is useful for cases where waiting for a response before taking further action is necessary,
 * and allows for a more straightforward flow of control in the application.
 */
export class SynchronousValidator implements AccountValidationService {
    /**
     * Constructs a new instance of the SynchronousValidator.
     * @param multiRequestValidator The underlying `AccountValidator` instance that will be used to make validation requests.
     * @param options Configuration options for the validator. Defaults to `defaultSynchronousValidatorOptions`.
     */
    constructor(
        private multiRequestValidator: AccountValidationService,
        private options = defaultSynchronousValidatorOptions
    ) {}

    /**
     * Check the status of a previously submitted validation request.
     * This method is used to determine the current status of a validation request and whether it has succeeded, failed, or is still pending.
     * @param id The ID of the validation request to check
     * @returns A promise that resolves to an `AccountValidationResult` object representing the current status of the validation request
     */
    async check(id: string): Promise<AccountValidationResult> {
        return await this.multiRequestValidator.check(id);
    }

    /**
     * Submit a file for validation.
     * This method first submits the file to the underlying `AccountValidator` instance, then continuously checks the status of the validation request until it is no longer in a "pending" state, or until a timeout is reached.
     * @param file The file to be submitted for validation
     * @returns A promise that resolves to an `AccountValidationResult` object representing the final status of the validation request
     * @throws An error if the validation request fails or if the request times out
     */
    async submit(file: Express.Multer.File): Promise<AccountValidationResult> {
        const res = await this.multiRequestValidator.submit(file); // Will throw if error

        const result = await this.waitForComplete(res.fileId);

        return result;
    }

    /**
     * Continuously check the status of a validation request until it is no longer "pending", or until a timeout is reached.
     * This method is used to ensure that the validation request has completed before returning the result.
     * @param id The ID of the validation request to wait for
     * @returns A promise that resolves to an `AccountValidationResult` object representing the final status of the validation request
     * @throws An error if the request times out and the validation status is still "pending"
     */
    private async waitForComplete(
        id: string
    ): Promise<AccountValidationResult> {
        let value: AccountValidationResult = { status: 'pending', fileId: id };
        const startTime = performance.now();
        let elapsedMs = 0;
        const { timeoutMs: timeout, errOnTimeout } = this.options;

        do {
            logger.debug(
                `SynchronousValidator. Checking if request complete yet.`
            );

            if (elapsedMs > timeout) {
                if (errOnTimeout) {
                    throw new Error(
                        `SynchronousValidator.waitForComplete: Timeout reached.`
                    );
                } else {
                    break;
                }
            }

            await sleep(500);

            value = await this.multiRequestValidator.check(id);

            elapsedMs = performance.now() - startTime;
        } while (value.status === "pending");

        return value;
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const accountValidatorService = new SynchronousValidator(
    new AccountValidator()
);
