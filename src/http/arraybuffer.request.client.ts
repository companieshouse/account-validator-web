import { Resource } from "@companieshouse/api-sdk-node";
import { File } from "private-api-sdk-node/dist/services/file-transfer/types";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { CHS_INTERNAL_API_KEY, INTERNAL_API_URL } from "../config";
import Mapping from "@companieshouse/api-sdk-node/dist/mapping/mapping";
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";


export const createLocalAPIClient = (): LocalAPIClient => {
    return new LocalAPIClient(new ArrayBufferRequestClient());
};

export default class LocalAPIClient {
    readonly arrayBufferRequestClient: ArrayBufferRequestClient;
    constructor(arrayBufferRequestClient: ArrayBufferRequestClient){
        this.arrayBufferRequestClient = arrayBufferRequestClient;
    }
}

/**
 * TODO: find a better way of getting this functionality into the ecosystem,
 * rather than in this service. This was added because we need 'get' request
 * using that returns arrayBuffer rather than json.
 */
export class ArrayBufferRequestClient {

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
        const resp = await this.rawGetArrayBuffer(`/validate/render/${fileId}`);

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
            size: resp.headers.byteLength,
            extension: extension
        };

        return {
            httpStatusCode: resp.status,
            resource: pdf
        };
    }

    /**
    * TODO: Move this code to a better fit for it.
    * This code has been add here due to it being only required by ImageRender's render
    * and other factor
     * @param url path to the endpoint
     * @returns
     */
    private async rawGetArrayBuffer(url: string) {
        try {
            const options: AxiosRequestConfig = {
                method: "GET",
                headers: {
                    authorization: CHS_INTERNAL_API_KEY,
                    accept: "application/json",
                    "content-type": "application/json"
                },
                url: `${INTERNAL_API_URL}${url}`,
                data: null,
                responseType: "arraybuffer"
            };

            // any errors (including status code errors) are thrown as exceptions and
            // will be caught in the catch block.
            const resp = await axios(options) as AxiosResponse;
            return {
                status: resp.status,
                body: resp.data,
                headers: resp.headers
            };
        } catch (e) {
            // e can be an instance of AxiosError or a generic error
            // however, we cannot specify a type for e coz type annotations for catch block errors must be 'any' or 'unknown' if specified
            const error = e?.response?.data || { message: "failed to execute http request" };
            return {
                status: e?.status || 500,
                error
            };
        }
    }
}
