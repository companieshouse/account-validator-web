import { Resource } from "@companieshouse/api-sdk-node";
import { ArrayBufferRequestClient } from "../../src/http/arraybuffer.request.client";
import { RenderAPIService } from "../../src/services/render.api.service";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import { File } from "private-api-sdk-node/dist/services/file-transfer/types";


const mockArrayBufferRequestClient = {
    rawGetArrayBuffer: jest.fn()
} as unknown as ArrayBufferRequestClient;

const mockRawGetRenderedPDF = mockArrayBufferRequestClient.rawGetArrayBuffer as jest.Mock;

describe("RenderAPIService", () => {
    let renderAPIService: RenderAPIService;


    beforeEach(() => {
        renderAPIService = new RenderAPIService(mockArrayBufferRequestClient);
    });


    it("should return an account file when the response is successful", async () => {
        const fileId = "fileId";
        const content = "";
        const expectedResponse: File = {
            body: content,
            fileName: `${fileId}`,
            mimeType: "application/pdf",
            size: 0,
            extension: "pdf"
        };

        mockRawGetRenderedPDF.mockReturnValue({
            status: 200,
            headers: {
                "content-type": "application/pdf",
                "content-length": 0
            },
            body: content
        });

        const result = await renderAPIService.rawGetRenderedPDF(
            fileId
        );

        const rawResource = (result as Resource<File>)?.resource;

        expect(result.httpStatusCode).toBe(200);
        expect(rawResource?.size).toBe(expectedResponse.size);
        expect(rawResource?.body).toBe(expectedResponse.body);
        expect(rawResource?.fileName).toBe(expectedResponse.fileName);
    });

    it("should return an error when content type is not application/pdf", async () => {
        const fileId = "fileId";
        const content = Buffer.from("", "binary");
        const arrayContent = content.buffer;

        mockRawGetRenderedPDF.mockReturnValue({
            status: 200,
            headers: {
                "content-type": "",
                "content-length": arrayContent.byteLength
            },
            body: content
        });
        try {
            await renderAPIService.rawGetRenderedPDF(
                fileId
            );
        } catch (e) {
            expect(e.message).toBe("Content type is not application/pdf");
        }
    });

    it("should return an error when the response is not successful", async () => {
        const fileId = "fileId";
        const expectedResponse = {
            status: 400,
            errors: []
        };

        mockRawGetRenderedPDF.mockReturnValue({
            status: 400,
            errors: []
        });

        const result = await renderAPIService.rawGetRenderedPDF(
            fileId
        );

        const errorResult = (result as ApiErrorResponse).errors;

        expect(result.httpStatusCode).toBe(400);
        expect(errorResult?.length).toBe(expectedResponse.errors.length);

    });
});
