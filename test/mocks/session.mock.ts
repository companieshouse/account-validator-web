import { Session } from "@companieshouse/node-session-handler";
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { SignInInfoKeys } from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys";
import { IAccessToken, ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";

export const getSessionRequest = (accessToken?: IAccessToken): Session => {
  return new Session({
    [SessionKey.SignInInfo]: {
      [SignInInfoKeys.SignedIn]: 1,
      [SignInInfoKeys.UserProfile]: { id: "j bloggs" },
      [SignInInfoKeys.AccessToken]: accessToken
    } as ISignInInfo
  });
};

export const getEmptySessionRequest = (): Session => {
  return new Session();
};
