jest.mock("ioredis");

import { NextFunction, Request, Response } from "express";
import { Session, SessionStore } from "@companieshouse/node-session-handler";

export const mockCreateSessionMiddleware = jest.fn();

export let mockSession = new Session();

mockCreateSessionMiddleware.mockImplementation((_sessionStore: SessionStore) => {
    return (req: Request, res: Response, next: NextFunction) => {
        req.session = mockSession;
        console.log('NSDBG req.session' + JSON.stringify(req.session));
        next();
    };
});

jest.mock("../../src/middleware/session.middleware", () => ({
    createSessionMiddleware: mockCreateSessionMiddleware,
}));

export function resetMockSession() {
    mockSession = new Session();
    console.log('NSDBG resetMockSession' + JSON.stringify(mockSession));
}
