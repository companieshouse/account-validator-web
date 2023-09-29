import { NextFunction, Request, Response } from "express";
import { timeout } from "../../src/middleware/timeout..middleware";

describe("Timeout middleware", () => {
    it("Should set request timeout to the specified duration", () => {
        const nextFn = jest.fn();
        const setTimeoutFn = jest.fn();

        const req = {
            setTimeout: setTimeoutFn
        } as unknown as Request;

        const res = {} as Response;

        const expectedTimeout = 5000;
        const middleware = timeout(expectedTimeout);

        middleware(req, res, nextFn as NextFunction);

        expect(setTimeoutFn).toHaveBeenCalledWith(expectedTimeout);
        expect(nextFn).toHaveBeenCalled();
    });
});
