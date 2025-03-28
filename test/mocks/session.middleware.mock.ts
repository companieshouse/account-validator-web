jest.mock("ioredis");
jest.mock("../../src/middleware/session.middleware");

import { NextFunction, Request, Response } from "express";
import { sessionMiddleware } from "../../src/middleware/session.middleware";
import { Session } from "@companieshouse/node-session-handler";
import { getSessionRequest } from "./session.mock";

// get handle on mocked function
export const mockSessionMiddleware = sessionMiddleware as jest.Mock;

export let mockSession = new Session();

export const mockRequestSession = () => mockSession = getSessionRequest();

// tell the mock what to return
mockSessionMiddleware.mockImplementation((req: Request, res: Response, next: NextFunction) => {
    req.session = mockSession;
    next();
});

export function resetMockSession() {
    mockSession = new Session();
}
