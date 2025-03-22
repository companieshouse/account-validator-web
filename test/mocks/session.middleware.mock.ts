jest.mock("ioredis");

import { NextFunction, Request, Response } from "express";
import { Session, SessionStore } from "@companieshouse/node-session-handler";

export const mockCreateSessionMiddleware = jest.fn();

export let mockSession = new Session();

mockCreateSessionMiddleware.mockImplementation((_sessionStore: SessionStore) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        req.session = mockSession;
        next();
    };
});

jest.mock("../../src/middleware/session.middleware", () => ({
    createSessionMiddleware: mockCreateSessionMiddleware,
}));

export function resetMockSession() {
    mockSession = new Session();
}
