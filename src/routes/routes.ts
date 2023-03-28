import { resultController } from "../controllers/result.controller";
import { Router } from "express";

import { startController } from "../controllers/start.controller";

export const router = Router();

router.use('/', startController);
router.use('/:id/result', resultController);
