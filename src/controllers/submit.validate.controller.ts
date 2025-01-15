import { Response, Request, Router, NextFunction } from "express";
import { Templates } from "../constants";
import { ValidationResult } from "../validation/validation.result";
import { AccountValidationResult } from "../services/account.validation.service";
import { validateSubmitRequest } from "../middleware/submit.validation.middleware";

export interface SubmitPageRequest extends Request {
    formValidationResult?: ValidationResult;
    accountValidationResult?: AccountValidationResult;
}

function addFormValidationResult(
    req: SubmitPageRequest,
    res: Response,
    next: NextFunction
) {
    req.formValidationResult =
        req.formValidationResult ?? new ValidationResult();

    next();
}

function renderResult(req: SubmitPageRequest, res: Response) {
    if (req.formValidationResult?.hasErrors) {
        res.status(400);
    }
    return res.render(Templates.SUBMIT, {
        formValidationResult: req.formValidationResult
    });
}

export const submitValidateController = Router();
submitValidateController.use(addFormValidationResult);

submitValidateController.post(
    "/",
    validateSubmitRequest,
    renderResult
);
