import {
    ImageRender,
    ImageRenderService,
} from "../../src/services/image.render.service";
import { Resource } from "@companieshouse/api-sdk-node";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import { File } from "private-api-sdk-node/dist/services/file-transfer/types";
import LocalAPIClient from "../../src/services/render.api.service";

const mockLocalAPIClient = {
    renderAPIService: {
        rawGetRenderedPDF: jest.fn()
    }
} as unknown as LocalAPIClient;

function createAccountValidatorResponse(
    httpStatusCode: number,
    body: ArrayBuffer,
    fileId: string,
    mimeType: string,
    size: number,
    extension: string,
): Resource<File> {
    return {
        httpStatusCode: httpStatusCode,
        resource: {
            fileName: fileId,
            body: body,
            mimeType: mimeType,
            size: size,
            extension: extension
        }
    };
}

function createEmptyAccountValidatorResponse(
    httpStatusCode: number
): Resource<undefined> {
    return {
        httpStatusCode: httpStatusCode,
        resource: undefined
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

let imageRender: ImageRenderService;
const mockRawGetRenderedPDF = mockLocalAPIClient.renderAPIService
    .rawGetRenderedPDF as jest.Mock;
describe("ImageRender", () => {
    beforeEach(() => {
        imageRender = new ImageRender(mockLocalAPIClient);
    });

    it("should throw an error if getRenderPDF returns a non-200 status code", async () => {
        // Given
        const fileId = "fileId";
        const errorResponse = createApiErrorResponse(
            500,
            "Internal Server Error"
        );
        mockRawGetRenderedPDF.mockRejectedValueOnce(errorResponse);

        // When/Then
        await expect(imageRender.render(fileId)).rejects.toEqual(
            errorResponse
        );
    });

    it("should throw an error if getRenderPDF throws an exception", async () => {
        // Given
        const fileId = "fileId";
        const error = new Error("Some error");
        mockRawGetRenderedPDF.mockRejectedValueOnce(error);

        // When/Then
        await expect(imageRender.render(fileId)).rejects.toEqual(error);
    });

    it("should return an AccountValidationResult if the request is successful", async () => {
        // Given
        const fileId = "fileId";
        const body = Buffer.from("").buffer;
        const resource = createAccountValidatorResponse(
            200,
            body,
            fileId,
            "application/pdf",
            0,
            ".pdf"
        );
        mockRawGetRenderedPDF.mockResolvedValueOnce(resource);

        // When
        const resp = await imageRender.render(fileId);

        // Then
        expect(resp.size).toBe(0);
        expect(resp.fileName).toBe(fileId);
        expect(resp.body).toBe(body);
    });

    it("should throw error if file has failed to be returned", async () => {
        // Given
        const fileId = "fileId";
        const resource = createEmptyAccountValidatorResponse(
            200
        );
        mockRawGetRenderedPDF.mockResolvedValueOnce(resource);

        // When
        try {
            await imageRender.render(fileId);
        } catch (error) {
            // Then
            expect(error.toString()).toBe("Error: Failed to render PDF");
        }

    });

});
