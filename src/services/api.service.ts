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
    logger.info(`Creating private API client with key ${CHS_INTERNAL_API_KEY.slice(0, 5)} (first 5 characters of key actual length ${CHS_INTERNAL_API_KEY.length})`);

    return createPrivateApiClient(CHS_INTERNAL_API_KEY, undefined, INTERNAL_API_URL);
};
