import { NextFunction,  Response } from "express";
import { SubmittedFileValidationRequest, isSubmittedFileValidationRequest, validateRequest } from "../validation/submit.controller.validation";
import { type SubmitPageRequest } from '../controllers/submit.controller';

export function validateSubmitRequest(req: SubmitPageRequest, res: Response, next: NextFunction) {
    console.log("NSDBG validateSubmitRequest enter");
    console.log("NSDBG validateSubmitRequest CSRF token in res.locals:", res.locals._csrf);
    if (req.method !== 'POST') {
        next();
        console.log("NSDBG validateSubmitRequest not a POST returning");
        return;
    }

    let submitForValidationRequest: SubmittedFileValidationRequest = { file: null };

    if (req.is('application/json')) {
        console.log("NSDBG validateSubmitRequest application/json");
        if (!isSubmittedFileValidationRequest(req.body)) {
            res.status(400);
            next();
            return;
        }

        console.log("NSDBG validateSubmitRequest submit=req.body");
        submitForValidationRequest = req.body;
    } else if (req.is("multipart/form-data")) {
        console.log("NSDBG validateSubmitRequest multipart/form-data submit=getSubmit(req)");
        submitForValidationRequest = getSubmitForValidationRequestFromRequest(req);
    }

    console.log("NSDBG validateSubmitRequest validateRequest");
    req.formValidationResult = validateRequest(submitForValidationRequest);
    next();
}

function getSubmitForValidationRequestFromRequest(req: SubmitPageRequest): SubmittedFileValidationRequest {
    console.log("NSDBG getSubmitForValidationRequestFromRequest");
    if (!req.file) {
        return { file: null };
    }

    return {
        file: {
            size: req.file.size,
            firstBytes: Uint8Array.prototype.slice.call(req.file.buffer, 0, 50).toString('utf-8'),
        }
    };
}


