import { Router } from "express";

import { resultController } from "../controllers/result.controller";
import { startController } from "../controllers/start.controller";
import { renderController } from "../controllers/render.controller";
import { submitController } from "../controllers/submit.controller";
import { submitValidateController } from "../controllers/submit.validate.controller";
import { healthCheckController } from "../controllers/health.check.controller";
import { errorController } from "../controllers/error.controller";
import { Urls } from "../constants";
import { progressController } from "../controllers/progress.controller";
import { authenticationMiddleware } from "../middleware/authentication.middleware";
import { COOKIE_CONFIG, sessionMiddleware } from "../middleware/session.middleware";
import { EnsureSessionCookiePresentMiddleware, SessionStore } from "@companieshouse/node-session-handler";
import { CACHE_SERVER } from "../config";
import Redis from "ioredis";

const setupSessionStore = () => {
    const redis = new Redis(`redis://${CACHE_SERVER}`);
    return new SessionStore(redis);
};

const router = Router();
const sessionStore = setupSessionStore();

router.use(Urls.HEALTH_CHECK_SUFFIX, healthCheckController);

router.use('/', startController);
router.use('/render/:id', renderController);
router.use(Urls.SUBMIT_VALIDATE_SUFFIX, submitValidateController);
router.use(Urls.SUBMIT_SUFFIX, submitController);
router.use(Urls.SUBMIT_PACKAGE_SUFFIX, sessionMiddleware(sessionStore), EnsureSessionCookiePresentMiddleware(COOKIE_CONFIG), authenticationMiddleware, submitController);
router.use(`${Urls.RESULT_SUFFIX}/:id`, resultController);
router.use(Urls.PROGRESS_SUFFIX, progressController);
router.use(Urls.ERROR_SUFFIX, errorController);

export default router;
