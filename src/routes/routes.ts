import { Router } from "express";

import { startController } from "../controllers";

export const router = Router();

router.get("/", startController.get);
router.post("/", startController.post);
