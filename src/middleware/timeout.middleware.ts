import { Handler } from "express";

export function timeout(timeoutMs: number): Handler {
    return (req, _res, next) => {
        req.setTimeout(timeoutMs);
        next();
    };
}
