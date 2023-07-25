import { NextFunction, Response } from "express";
import { SubmitPageRequest } from "../../src/controllers/submit.controller";
import { validateSubmitRequest } from "../../src/middleware/submit.validation.middleware";

describe("Submit validation middleware", () => {
    it("Should proceed on non POST requests", () => {
        const nextFn = jest.fn();
        const req = {
            method: "GET"
        } as SubmitPageRequest;

        const res = {} as Response;
        validateSubmitRequest(req, res, nextFn as NextFunction);

        expect(nextFn).toHaveBeenCalled();
    });

    it("Should return status 400 for invalid JSON bodies", () => {
        const nextFn = jest.fn() as NextFunction;
        const req = {
            method: "POST",
            is: (ct) => ct === 'application/json',
            body: "not the right type"
        } as SubmitPageRequest;


        const res = {} as Response;
        res.status = jest.fn().mockReturnValue(res);

        validateSubmitRequest(req, res, nextFn);

        expect(res.status).toBeCalledWith(400);
    });
});
