import { API_URL, CHS_API_KEY, CHS_INTERNAL_API_KEY, INTERNAL_API_URL } from "../config";
import { createApiClient } from "@companieshouse/api-sdk-node/dist";
import ApiClient from "@companieshouse/api-sdk-node/dist/client";
import { createPrivateApiClient } from "private-api-sdk-node";
import PrivateApiClient from 'private-api-sdk-node/dist/client';
import { logger } from "../utils/logger";

export const createPublicApiKeyClient = (): ApiClient => {
    return createApiClient(CHS_API_KEY, undefined, API_URL);
};

export const createPrivateApiKeyClient = (): PrivateApiClient => {
    logger.info(`Creating private API client with key ${maskString(CHS_INTERNAL_API_KEY)}`);

    return createPrivateApiClient(CHS_INTERNAL_API_KEY, undefined, INTERNAL_API_URL);
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
function maskString(s: string, n = 5, mask = '*'): string {
    return [...s]
        .map((char, index) => (index < n ? char : mask))
        .join("");
}
