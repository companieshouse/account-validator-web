import { Router } from "express";

import { startController } from "../controllers/start.controller";

export const router = Router();

router.use('/', startController);
