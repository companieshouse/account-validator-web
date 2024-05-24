import {
    API_CALL_RETRY_DELAY_MS,
    API_URL,
    CHS_API_KEY,
    CHS_INTERNAL_API_KEY,
    INTERNAL_API_URL,
    MAX_API_CALL_RETRIES,
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
import { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";

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

function isOkStatus(status: number) {
    return 200 <= status && status < 300;
}

function retryIfStatusNotOkay<T extends ApiErrorResponse>(resp: T): boolean {
    const status = resp.httpStatusCode;
    return status === undefined || !isOkStatus(status);
}

export async function makeApiCallWithRetry<T extends ApiErrorResponse>(fn: () => Promise<T>, shouldRetry: (resp: T) => boolean = retryIfStatusNotOkay): Promise<T> {
    let resp: T | undefined = undefined;
    let error: any = undefined;

    const maxRetries = parseInt(MAX_API_CALL_RETRIES);
    const retryDelay = parseInt(API_CALL_RETRY_DELAY_MS);

    for (let i = 0; i < maxRetries; i++) {
        try {
            resp = await fn();
            if (!shouldRetry(resp)) {
                return resp;
            }

            logger.error(`Retrying API call. Received error response.`);
        } catch (e) {
            logger.error(`Exception thrown whilst making api call: ${e}`);
            error = e;
            resp = undefined;
        }

        const retriesRemaining = maxRetries - (i + 1);
        if (retriesRemaining > 0) {
            await delay(retryDelay);
            logger.info(`Trying failed API call. ${retriesRemaining} Retries remaining.`);
        }
    }

    if (resp !== undefined) {
        return resp;
    }

    if (error !== undefined) {
        throw error;
    }


    throw new Error(`Unable to make API call. No response available.`);
}

function delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
