import { Router } from "express";
import { handleErrors } from "../middleware/error.handler";
import { accountValidatorService } from "../services/account.validation.service";
import { logger } from "../utils/logger";

export const progressController = Router({ mergeParams: true });

progressController.get(`/:id`, handleErrors(async (req, res) => {
    logger.info(`Returning progress`);
    const fileId = req.params["id"];
    const accountValidationResult = await accountValidatorService.check(fileId);

    res.json({
        progress: accountValidationResult.percent
    });
}));
