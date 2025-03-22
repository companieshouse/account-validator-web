import { Handler } from "express";

export function timeout(timeoutMs: number): Handler {
    console.log("NSDBG TM");
    return (req, _res, next) => {
        req.setTimeout(timeoutMs);
        next();
    };
}
