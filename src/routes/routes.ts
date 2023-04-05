import { Router } from "express";

import { resultController } from "../controllers/result.controller";
import { startController } from "../controllers/start.controller";
import { submitController } from "../controllers/submit.controller";
import { Urls } from "../constants";

export const router = Router();

router.use('/', startController);
router.use(Urls.SUBMIT_SUFFIX, submitController);
router.use(`${Urls.RESULT_SUFFIX}/:id`, resultController);
