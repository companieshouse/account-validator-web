import { Router } from "express";

import { startController } from "../controllers";

export const router: Router = Router();
   
router.get("/", startController.get);
