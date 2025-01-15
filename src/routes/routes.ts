import { Router } from "express";

import { resultController } from "../controllers/result.controller";
import { startController } from "../controllers/start.controller";
import { renderController } from "../controllers/render.controller";
import { submitController } from "../controllers/submit.controller";
import { healthCheckController } from "../controllers/health.check.controller";
import { errorController } from "../controllers/error.controller";
import { Urls } from "../constants";
import { progressController } from "../controllers/progress.controller";
import { authenticationMiddleware } from "../middleware/authentication.middleware";
import { sessionMiddleware } from "../middleware/session.middleware";
import { cookieCheckMiddleware } from "../middleware/cookie.check.middleware";


const router = Router();

router.use(Urls.HEALTH_CHECK_SUFFIX, healthCheckController);

router.use('/', startController);
router.use('/render/:id', renderController);
router.use(Urls.SUBMIT_SUFFIX, submitController);
router.use(Urls.SUBMIT_PACKAGE_SUFFIX, sessionMiddleware, cookieCheckMiddleware, authenticationMiddleware, submitController);
router.use(`${Urls.RESULT_SUFFIX}/:id`, resultController);
router.use(Urls.PROGRESS_SUFFIX, progressController);
router.use(Urls.ERROR_SUFFIX, errorController);

export default router;
