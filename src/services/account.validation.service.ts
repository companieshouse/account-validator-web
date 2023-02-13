import { Resource } from "@companieshouse/api-sdk-node/src";
import ApiClient from "@companieshouse/api-sdk-node/src/client";
import { AccountValidatorResponse } from "@companieshouse/api-sdk-node/src/services/account-validator/types";
import { logger } from "../utils/logger";
import { createPublicApiKeyClient } from "./api.service";
import { performance } from "perf_hooks";

export interface AccountValidationService {
    submit(file: Express.Multer.File): Promise<AccountValidationResult>;
    check(id: string): Promise<AccountValidationResult>;
}

interface SuccessValidationResult {
    status: "success";
    fileId: string;
    imageUrl?: string;
}

interface FailureValidationResult {
    status: "failure";
    fileId: string;
    reasons: string[];
}

interface PendingValidationResult {
    status: "pending";
    fileId: string;
}

export type AccountValidationResult =
    | SuccessValidationResult
    | FailureValidationResult
    | PendingValidationResult;

export function mapResponseType(
    accountValidatorResource: Resource<AccountValidatorResponse>
): AccountValidationResult {
    const accountValidatorResponse = (
        accountValidatorResource as Resource<AccountValidatorResponse>
    ).resource!;

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

const idMap = {
    "success.xhtml": "1f105de5-1ace-46df-84e4-15bfb9d1411a",
    "failure_duplicate_facts.xhtml": "2a089d94-785e-42a9-97cf-c85c26ee83ca",
};

export class AccountValidator implements AccountValidationService {
    constructor(private apiClient: ApiClient = createPublicApiKeyClient()) {}

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

    async submit(file: Express.Multer.File): Promise<AccountValidationResult> {
        // TODO: Upload to S3 using File Transfer Service(FTS)
        const fileId = this.simulateFTSUpload(file);

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

    private simulateFTSUpload(file: Express.Multer.File): string {
        const fileId = idMap[file.originalname]; // Replace this with the actual fileId returned from FTS
        if (!fileId) {
            throw new Error(
                `Unknown file ${
                    file.originalname
                }. Must be one of ${Object.keys(idMap)}`
            );
        }

        return fileId;
    }
}

class SingleRequestFacade implements AccountValidationService {
    constructor(private multiRequestValidator: AccountValidationService) {}

    async check(id: string): Promise<AccountValidationResult> {
        return await this.multiRequestValidator.check(id);
    }

    async submit(file: Express.Multer.File): Promise<AccountValidationResult> {
        const res = await this.multiRequestValidator.submit(file); // Will throw if error

        const result = await this.waitForComplete(res.fileId);

        return result;
    }

    private async waitForComplete(
        id: string
    ): Promise<AccountValidationResult> {
        let value: AccountValidationResult;
        const startTime = performance.now();
        let elapsedMs = 0;
        const tenSeconds = 10_000;

        do {
            logger.debug(
                `SingleRequestFacade. Checking if request complete yet.`
            );

            if (elapsedMs > tenSeconds) {
                throw new Error(`SingleRequestFacade.waitForComplete: Timeout reached.`);
            }

            await sleep(500);
            value = await this.multiRequestValidator.check(id);
            elapsedMs = performance.now() - startTime;
        } while (value.status === "pending");

        return value;
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const accountValidatorService = new SingleRequestFacade(
    new AccountValidator()
);
