import PrivateApiClient from "private-api-sdk-node/dist/client";
import {
    AccountValidationService,
    AccountValidator,
    validFileForRendering,
} from "../../src/services/account.validation.service";
import { Resource } from "@companieshouse/api-sdk-node";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import { AccountValidatorResponse } from "private-api-sdk-node/dist/services/account-validator/types";
import { Id } from "private-api-sdk-node/dist/services/file-transfer/types";

const mockPrivateApiClient = {
    accountValidatorService: {
        postFileForValidation: jest.fn(),
        getFileValidationStatus: jest.fn(),

    },
    fileTransferService: {
        upload: () => {
            return Promise.resolve(
                    { resource: { id: "123" } } as unknown as Resource<Id>
            );
        }
    }
} as unknown as PrivateApiClient;

function createAccountValidatorResponse(
    httpStatusCode: number,
    status: "complete" | "pending",
    fileId: string,
    fileName: string,
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
            fileName: fileName,
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

describe("validFileForRendering", () => {
    it("should return true if file end with ixbrl", () => {
        // Given
        const fileName = "fileId.ixbrl";

        // When/Then
        expect(validFileForRendering(fileName)).toEqual(true);
    });
    it("should return true if file end with xhtml", () => {
        // Given
        const fileName = "fileId.xhtml";

        // When/Then
        expect(validFileForRendering(fileName)).toEqual(true);
    });
    it("should return false if file end with zip", () => {
        // Given
        const fileName = "fileId.zip";

        // When/Then
        expect(validFileForRendering(fileName)).toEqual(false);
    });
});

let accountValidator: AccountValidationService;
const mockPostForValidation = mockPrivateApiClient.accountValidatorService
    .postFileForValidation as jest.Mock;
const mockGetFileValidationStatus = mockPrivateApiClient.accountValidatorService
    .getFileValidationStatus as jest.Mock;
describe("AccountValidator", () => {
    beforeEach(() => {
        accountValidator = new AccountValidator(mockPrivateApiClient);
    });

    it("should submit a file to the api for validation", async () => {
        // Given
        const file = {
            originalname: "success.xhtml",
            buffer: {
                toString: () => {
                    return "abc";
                }
            }
        } as Express.Multer.File;

        const resource = createAccountValidatorResponse(
            200,
            "pending",
            "fileId",
            file.originalname,
            "OK"
        );
        mockPostForValidation.mockResolvedValue(resource);

        // When
        const resp = await accountValidator.submit(file);

        // Then
        expect(resp.status).toBe("pending");
        expect(resp.fileId).toBe("fileId");
    });

    it("should submit a file to the api for validation with package type", async () => {
        // Given
        const file = {
            originalname: "success.xhtml",
            buffer: {
                toString: () => {
                    return "abc";
                }
            }
        } as Express.Multer.File;

        const resource = createAccountValidatorResponse(
            200,
            "pending",
            "fileId",
            file.originalname,
            "OK"
        );
        mockPostForValidation.mockResolvedValue(resource);

        // When
        const resp = await accountValidator.submit(file, "UKSEF");

        // Then
        expect(mockPostForValidation).toHaveBeenCalledWith({ fileName: 'success.xhtml', id: '123', packageType: 'UKSEF' });
        expect(resp.status).toBe("pending");
        expect(resp.fileId).toBe("fileId");
    });

    // it("should throw an error if postFileForValidation returns a non-200 status code", async () => {
    //     // Given
    //     const file = {
    //         originalname: "failure_duplicate_facts.xhtml",
    //     } as Express.Multer.File;
    //     const errorResponse = createApiErrorResponse(
    //         500,
    //         "Internal Server Error"
    //     );
    //     mockPostForValidation.mockRejectedValueOnce(errorResponse);

    //     // When/Then
    //     await expect(accountValidator.submit(file)).rejects.toEqual(
    //         errorResponse
    //     );
    // });

    // it("should throw an error if postFileForValidation returns a non-200 status code", async () => {
    //     // Given
    //     const file = {
    //         originalname: "failure_duplicate_facts.xhtml",
    //     } as Express.Multer.File;
    //     const errorResponse = createApiErrorResponse(
    //         500,
    //         "Internal Server Error"
    //     );

    //     mockPostForValidation.mockResolvedValueOnce(errorResponse);

    //     // When/Then
    //     await expect(accountValidator.submit(file)).rejects.toEqual(
    //         errorResponse
    //     );
    // });

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
            "",
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
            "",
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
