import { NextFunction,  Response } from "express";
import { SubmittedFileValidationRequest, isSubmittedFileValidationRequest, validateRequest } from "../validation/submit.controller.validation";
import { type SubmitPageRequest } from '../controllers/submit.controller';

export function validateSubmitRequest(req: SubmitPageRequest, res: Response, next: NextFunction) {
    if (req.method !== 'POST') {
        next();
        return;
    }

    let submitForValidationRequest: SubmittedFileValidationRequest = { file: null };

    if (req.is('application/json')) {
        if (!isSubmittedFileValidationRequest(req.body)) {
            res.status(400);
            next();
            return;
        }

        submitForValidationRequest = req.body;
    } else if (req.is("multipart/form-data")) {
        submitForValidationRequest = getSubmitForValidationRequestFromRequest(req);
    }

    req.formValidationResult = validateRequest(submitForValidationRequest);
    next();
}

function getSubmitForValidationRequestFromRequest(req: SubmitPageRequest): SubmittedFileValidationRequest {
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
