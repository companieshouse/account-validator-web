import { Resource } from "@companieshouse/api-sdk-node/dist";
import ApiClient from "@companieshouse/api-sdk-node/dist/client";
import { AccountValidatorResponse } from "@companieshouse/api-sdk-node/dist/services/account-validator/types";
import { createPublicApiKeyClient } from "./api.service";

export interface AccountValidationService {
    submit(file: Express.Multer.File): Promise<AccountValidationResult>
}

interface SuccessValidationResult {
    status: 'success'
    imageUrl?: string
}

interface FailureValidationResult {
    status: 'failure'
    reasons: string[]
}

export type AccountValidationResult
    = SuccessValidationResult
    | FailureValidationResult;

export function mapResponseType(accountValidatorResource: Resource<AccountValidatorResponse>): AccountValidationResult{
    const accountValidatorResponse = (accountValidatorResource as Resource<AccountValidatorResponse>).resource!;

    switch (accountValidatorResponse.requestStatus.status){
            case "OK": return { status: "success" };
            case "FAILED":  return { status: "failure", reasons: accountValidatorResponse.requestStatus.result.errorMessages };
            default: throw "This is not possbile. Only possible options are OK and FAILED";
    }
}
// TODO: implement an API based validator that will upload a file to S3 then forward the url to the API to validate.

// Only used for testing. Should be removed once API based validator is implemented
export class DummyValidator implements AccountValidationService {
    constructor(private resultMap: Record<string, AccountValidationResult> = {}) {

    }

    addFile(name: string, result: AccountValidationResult) {
        this.resultMap[name] = result;
    }

    submit(file: Express.Multer.File): Promise<AccountValidationResult> {
        let result = this.resultMap[file.originalname];
        result = result !== undefined
            ? result
            : {
                status: 'failure',
                reasons: [ 'Validation failure reason' ]
            };

        return new Promise(resolve => resolve(result));
    }
}

export class AccountValidator implements AccountValidationService {

    constructor(private apiClient: ApiClient = createPublicApiKeyClient()) {

    }

    async submit(file: Express.Multer.File): Promise<any> {
        // TODO: Upload to S3 using File Transfer Service(FTS)
        const fileId = "fileId"; // Replace this with the actual fileId returned from FTS
        const requestPayload = { "fileName": file.filename, "id": fileId };
        const accountValidatorService = this.apiClient.accountValidatorService;
        const accountValidatorResponse = await accountValidatorService.postFileForValidation(requestPayload);

        if (accountValidatorResponse.httpStatusCode !== 200){
            throw accountValidatorResponse; // If the status code is not 200, the return type is ApiErrorResponse
        }
        return mapResponseType(accountValidatorResponse as Resource<AccountValidatorResponse>);
    }
}

export const accountValidatorService = new AccountValidator();
