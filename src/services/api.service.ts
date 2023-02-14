import { Session } from "@companieshouse/node-session-handler";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { SignInInfoKeys } from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys";
import { AccessTokenKeys } from "@companieshouse/node-session-handler/lib/session/keys/AccessTokenKeys";
import { API_URL, CHS_API_KEY } from "../config";
import { createAndLogError } from "../utils/logger";
import { createApiClient } from "@companieshouse/api-sdk-node/dist";
import ApiClient from "@companieshouse/api-sdk-node/dist/client";

export const createPublicOAuthApiClient = (session: Session): ApiClient => {
    const oAuth = session.data?.[SessionKey.SignInInfo]?.[SignInInfoKeys.AccessToken]?.[AccessTokenKeys.AccessToken];
    if (oAuth) {
        return createApiClient(undefined, oAuth, API_URL);
    }
    throw createAndLogError("Error getting session keys for creating public api client");
};

export const createPublicApiKeyClient = (): ApiClient => {
    return createApiClient(CHS_API_KEY, undefined, API_URL);
};
