import { Request, Response } from "express";
import { sessionMiddleware } from "../../src/middleware/session.middleware";

describe("Submit session middleware", () => {

    it("it should return before hitting SessionMiddleware if packageType is not set", () => {
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn();
        sessionMiddleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it("it should hit SessionMiddleware if packageType is set", () => {
        const req = { query: {
            packageType: "uksef",
        } } as unknown as Request;
        const res = {} as Response;
        const next = jest.fn();
        sessionMiddleware(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });
});
