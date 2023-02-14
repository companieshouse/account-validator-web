import ApiClient from "@companieshouse/api-sdk-node/dist/client";
import {
    AccountValidationResult,
    AccountValidationService,
    AccountValidator,
    SynchronousValidator,
} from "../../src/services/account.validation.service";
import { Resource } from "@companieshouse/api-sdk-node";
import { AccountValidatorResponse } from "@companieshouse/api-sdk-node/dist/services/account-validator";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";

const mockApiClient = {
    accountValidatorService: {
        postFileForValidation: jest.fn(),
        getFileValidationStatus: jest.fn(),
    },
} as unknown as ApiClient;

function createAccountValidatorResponse(
    httpStatusCode: number,
    status: "complete" | "pending",
    fileId: string,
    validationStatus: "OK" | "FAILED"
): Resource<AccountValidatorResponse> {
    return {
        httpStatusCode: httpStatusCode,
        resource: {
            status: status,
            result: {
                errorMessages: [],
                data: {
                    balanceSheetDate: "",
                    accountsType: "",
                    companieshouseRegisteredNumber: "",
                },
                validationStatus: validationStatus,
            },
            fileId: fileId,
        },
    };
}

export const createApiErrorResponse = (
    httpStatusCode: number,
    errorMessage: string
): ApiErrorResponse => {
    return {
        httpStatusCode,
        errors: [
            {
                error: errorMessage,
            },
        ],
    };
};

let accountValidator: AccountValidationService;
const mockPostForValidation = mockApiClient.accountValidatorService
    .postFileForValidation as jest.Mock;
const mockGetFileValidationStatus = mockApiClient.accountValidatorService
    .getFileValidationStatus as jest.Mock;
describe("AccountValidator", () => {
    beforeEach(() => {
        accountValidator = new AccountValidator(mockApiClient);
    });

    it("should submit a file to the api for validation", async () => {
        // Given
        const file = {
            originalname: "success.xhtml",
        } as Express.Multer.File;

        const resource = createAccountValidatorResponse(
            200,
            "pending",
            "fileId",
            "OK"
        );
        mockPostForValidation.mockResolvedValue(resource);

        // When
        const resp = await accountValidator.submit(file);

        // Then
        expect(resp.status).toBe("pending");
        expect(resp.fileId).toBe("fileId");
    });

    it("should throw an error if postFileForValidation returns a non-200 status code", async () => {
        // Given
        const file = {
            originalname: "failure_duplicate_facts.xhtml",
        } as Express.Multer.File;
        const errorResponse = createApiErrorResponse(
            500,
            "Internal Server Error"
        );
        mockPostForValidation.mockRejectedValueOnce(errorResponse);

        // When/Then
        await expect(accountValidator.submit(file)).rejects.toEqual(
            errorResponse
        );
    });

    it("should throw an error if postFileForValidation returns a non-200 status code", async () => {
        // Given
        const file = {
            originalname: "failure_duplicate_facts.xhtml",
        } as Express.Multer.File;
        const errorResponse = createApiErrorResponse(
            500,
            "Internal Server Error"
        );

        mockPostForValidation.mockResolvedValueOnce(errorResponse);

        // When/Then
        await expect(accountValidator.submit(file)).rejects.toEqual(
            errorResponse
        );
    });

    it("should throw an error if getFileValidationStatus returns a non-200 status code", async () => {
        // Given
        const fileId = "fileId";
        const errorResponse = createApiErrorResponse(
            500,
            "Internal Server Error"
        );
        mockGetFileValidationStatus.mockRejectedValueOnce(errorResponse);

        // When/Then
        await expect(accountValidator.check(fileId)).rejects.toEqual(
            errorResponse
        );
    });

    it("should throw an error if getFileValidationStatus throws an exception", async () => {
        // Given
        const fileId = "fileId";
        const error = new Error("Some error");
        mockGetFileValidationStatus.mockRejectedValueOnce(error);

        // When/Then
        await expect(accountValidator.check(fileId)).rejects.toEqual(error);
    });

    it("should return an AccountValidationResult if the request is successful", async () => {
        // Given
        const fileId = "fileId";
        const resource = createAccountValidatorResponse(
            200,
            "complete",
            fileId,
            "OK"
        );
        mockGetFileValidationStatus.mockResolvedValueOnce(resource);

        // When
        const resp = await accountValidator.check(fileId);

        // Then
        expect(resp.status).toBe("success");
        expect(resp.fileId).toBe(fileId);
    });

    it("should return an AccountValidationResult with 'failure' status if the request fails validation", async () => {
        // Given
        const fileId = "fileId";
        const resource = createAccountValidatorResponse(
            200,
            "complete",
            fileId,
            "FAILED"
        );
        mockGetFileValidationStatus.mockResolvedValueOnce(resource);

        // When
        const resp = await accountValidator.check(fileId);

        // Then
        expect(resp.status).toBe("failure");
        expect(resp.fileId).toBe(fileId);
    });

});


describe('SynchronousValidator', () => {
    const mockMultiRequestValidator = {
        check: jest.fn(),
        submit: jest.fn()
    };

    const mockFile = {
        originalname: "success.xhtml",
    } as Express.Multer.File;

    const defaultSynchronousValidatorOptions = {
        errOnTimeout: true,
        timeoutMs: 60000,
    };

    let syncValidator: SynchronousValidator;

    beforeEach(() => {
        mockMultiRequestValidator.check.mockReset();
        mockMultiRequestValidator.submit.mockReset();
        syncValidator = new SynchronousValidator(
            mockMultiRequestValidator,
            defaultSynchronousValidatorOptions
        );
    });

    describe('check', () => {
        it('should call the check method of the multi-request validator and return its result', async () => {
            // Given
            const expectedResponse: AccountValidationResult = {
                fileId: 'test-file-id',
                status: 'success'
            };
            mockMultiRequestValidator.check.mockResolvedValueOnce(expectedResponse);

            // When
            const response = await syncValidator.check(expectedResponse.fileId);

            // Then
            expect(mockMultiRequestValidator.check).toHaveBeenCalledWith(expectedResponse.fileId);
            expect(response).toEqual(expectedResponse);
        });
    });

    describe('submit', () => {
        it('should call the submit method of the multi-request validator and wait for the validation result', async () => {
            // Given
            const expectedResponse: AccountValidationResult = {
                fileId: 'test-file-id',
                status: 'success'
            };
            mockMultiRequestValidator.submit.mockResolvedValueOnce(expectedResponse);
            mockMultiRequestValidator.check.mockResolvedValueOnce(expectedResponse);

            // When
            const response = await syncValidator.submit(mockFile);

            // Then
            expect(mockMultiRequestValidator.submit).toHaveBeenCalledWith(mockFile);
            expect(mockMultiRequestValidator.check).toHaveBeenCalledWith(expectedResponse.fileId);
            expect(response).toEqual(expectedResponse);
        });
    });
});
