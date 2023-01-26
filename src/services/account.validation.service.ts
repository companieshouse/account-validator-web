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

export const accountValidatorService = new DummyValidator({ 'accounts_success.zip': { status: 'success', imageUrl: 'https://www.google.co.uk' } });
