import {
    API_URL,
    CHS_API_KEY,
    CHS_INTERNAL_API_KEY,
    INTERNAL_API_URL,
    MAX_FILE_SIZE,
} from "../config";
import {
    RequestClient,
    createApiClient,
} from "@companieshouse/api-sdk-node/dist";
import ApiClient from "@companieshouse/api-sdk-node/dist/client";
import { createPrivateApiClient } from "private-api-sdk-node";
import PrivateApiClient from "private-api-sdk-node/dist/client";
import { logger } from "../utils/logger";
import {
    AdditionalOptions,
    HttpResponse,
} from "@companieshouse/api-sdk-node/dist/http/http-client";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const createPublicApiKeyClient = (): ApiClient => {
    return createApiClient(CHS_API_KEY, undefined, API_URL);
};

export const createPrivateApiKeyClient = (): PrivateApiClient => {
    logger.info(
        `Creating private API client with key ${maskString(
            CHS_INTERNAL_API_KEY
        )}`
    );

    const sdkClient =  createPrivateApiClient(
        CHS_INTERNAL_API_KEY,
        undefined,
        INTERNAL_API_URL
    );

    const apiClient = new LargeBodyRequestClient(sdkClient.apiClient as RequestClient, base64Size(MAX_FILE_SIZE));


    return new PrivateApiClient(apiClient, sdkClient.accountClient);
};

/**
 * Masks a string by replacing characters after a specified position with a mask character.
 *
 * @param s - The input string to be masked.
 * @param n - The number of characters to preserve at the beginning of the string (default: 5).
 * @param mask - The character used for masking (default: '*').
 * @returns The masked string with characters after the specified position replaced by the mask character.
 *
 * @example
 * const input = "Hello, world!";
 * const masked = maskString(input);
 * console.log(masked); // Output: "Hello,******"
 */
function maskString(s: string, n = 5, mask = "*"): string {
    return [...s].map((char, index) => (index < n ? char : mask)).join("");
}

class LargeBodyRequestClient extends RequestClient {
    constructor(requestClient: RequestClient, private maxBodySize: number) {
        super(requestClient["options"]);
        // Override private method
        this["request"] = this.largeRequest;
    }

    private async largeRequest(
        additionalOptions: AdditionalOptions
    ): Promise<HttpResponse> {
        try {
            const options: AxiosRequestConfig = {
                method: additionalOptions.method,
                headers: {
                    ...this.headers,
                    ...additionalOptions.headers,
                },
                url: `${this.options.baseUrl}${additionalOptions.url}`,
                data: additionalOptions.body,
                responseType: "json",
                maxBodyLength: this.maxBodySize,
                maxContentLength: this.maxBodySize,

                validateStatus: () => true,
            };

            // any errors (including status code errors) are thrown as exceptions and
            // will be caught in the catch block.
            const resp = (await axios(options)) as AxiosResponse;
            return {
                status: resp.status,
                body: resp.data,
                headers: resp.headers,
            };
        } catch (e) {
            // e can be an instance of AxiosError or a generic error
            // however, we cannot specify a type for e coz type annotations for catch block errors must be 'any' or 'unknown' if specified
            const error = e?.response?.data || {
                message: "failed to execute http request",
            };
            return {
                status: e?.status || 500,
                error,
            };
        }
    }
}

/**
 * Calculates the size of data after Base64 encoding.
 *
 * Base64 encoding inflates the size of the data by approximately 33%.
 * Every 3 bytes of data gets converted into 4 bytes of Base64-encoded data.
 *
 * @param sizeInBytes - The original size of data in bytes.
 * @returns The size of the data in bytes after Base64 encoding, including necessary padding.
 */
function base64Size(sizeInBytes: number) {
    const base64Size = Math.ceil((sizeInBytes * 4) / 3);

    const padding = base64Size % 4 === 0 ? 0 : 4 - (base64Size % 4);

    return base64Size + padding;
}
