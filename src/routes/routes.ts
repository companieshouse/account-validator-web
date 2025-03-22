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
import { createSessionMiddleware } from "../middleware/session.middleware";
import { cookieCheckMiddleware } from "../middleware/cookie.check.middleware";
import { createCsrfProtectionMiddleware } from "../middleware/csrf.middleware";
import { multipartMiddleware } from "../middleware/multipart.middleware";
import { SessionStore } from "@companieshouse/node-session-handler";
import { CACHE_SERVER } from "../config";
import Redis from "ioredis";

const redis = new Redis(`redis://${CACHE_SERVER}`);
const sessionStore = new SessionStore(redis);
console.log("NSDBG original sessionStore: " + sessionStore);
const sessionMiddleware = createSessionMiddleware(sessionStore);
const csrfProtectionMiddleware = createCsrfProtectionMiddleware(sessionStore);
const router = Router();

router.use(Urls.HEALTH_CHECK_SUFFIX, healthCheckController);

router.use('/', sessionMiddleware, csrfProtectionMiddleware, startController);
router.use('/render/:id', renderController);

// /submit-accounts - start here http://chs.local/xbrl_validate
router.use(Urls.SUBMIT_SUFFIX, sessionMiddleware, /* multipartMiddleware,*/ csrfProtectionMiddleware, submitController);
// router.use(Urls.SUBMIT_SUFFIX, submitController); // original

// /submit - start here http://chs.local/accounts-filing
router.use(Urls.SUBMIT_PACKAGE_SUFFIX, sessionMiddleware, /* multipartMiddleware,*/ csrfProtectionMiddleware, cookieCheckMiddleware, authenticationMiddleware, submitController);
// router.use(Urls.SUBMIT_PACKAGE_SUFFIX, sessionMiddleware, cookieCheckMiddleware, authenticationMiddleware, submitController); // original
router.use(`${Urls.RESULT_SUFFIX}/:id`, resultController);
router.use(Urls.PROGRESS_SUFFIX, progressController);
router.use(Urls.ERROR_SUFFIX, errorController);

export default router;
