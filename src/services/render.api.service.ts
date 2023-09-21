import { Resource } from "@companieshouse/api-sdk-node";
import { File } from "private-api-sdk-node/dist/services/file-transfer/types";
import Mapping from "@companieshouse/api-sdk-node/dist/mapping/mapping";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import { ArrayBufferRequestClient } from "../http/arraybuffer.request.client";

/**
 * This class is required because api-sdk-node only offers response type of json,
 * however this service requires response type of array buffer, as well as json.
 * The file only deals with requests requiring response type array buffer
 */

export const createLocalAPIClient = (): LocalAPIClient => {
    return new LocalAPIClient(new ArrayBufferRequestClient());
};

export default class LocalAPIClient {
    readonly renderAPIService: RenderAPIService;

    constructor(arrayBufferRequestClient: ArrayBufferRequestClient){
        this.renderAPIService = new RenderAPIService(arrayBufferRequestClient);
    }
}


/**
 * TODO: find a better way of getting this functionality into the ecosystem,
 * rather than in this service. This was added because we need 'get' request
 * using that returns arrayBuffer rather than json.
 */
class RenderAPIService {

    constructor (private readonly client: ArrayBufferRequestClient) {}

    /**
     * TODO: Move this code to a better fit for it.
     * This code has been add here due to it being only required by ImageRender's render
     * and other factor.
     * GET method to get the rendered file as PDF
     * @param fileId
     * @returns
     */
    async rawGetRenderedPDF(
        fileId: string
    ): Promise<Resource<File> | ApiErrorResponse> {
        const mimeType = "application/pdf";
        const fileNameTemplate = `${fileId}`;
        const extension = "pdf";
        const resp = await this.client.rawGetArrayBuffer(`/account-validator/validate/render/${fileId}`);

        if (resp.status !== 200) {
            return {
                httpStatusCode: resp.status,
                errors: []
            };
        }

        const headers = Mapping.camelCaseKeys(resp.headers);
        const contentType = headers?.["contentType"];
        if (contentType === undefined || contentType === null || (contentType !== "application/pdf")) {
            throw new Error("Content type is not application/pdf");
        }

        const pdf: File = {
            fileName: fileNameTemplate,
            body: resp.body,
            mimeType: mimeType,
            size: resp.headers?.byteLength,
            extension: extension
        };

        return {
            httpStatusCode: resp.status,
            resource: pdf
        };
    }
}
