import { Router } from "express";

import { resultController } from "../controllers/result.controller";
import { startController } from "../controllers/start.controller";
import { renderController } from "../controllers/render.controller";
import { submitController } from "../controllers/submit.controller";
import { healthCheckController } from "../controllers/health.check.controller";
import { Urls } from "../constants";

export const router = Router();

router.use('/', startController);
router.use('/render/:id', renderController);
router.use(Urls.SUBMIT_SUFFIX, submitController);
router.use(`${Urls.RESULT_SUFFIX}/:id`, resultController);
router.use(Urls.HEALTH_CHECK_SUFFIX, healthCheckController);
