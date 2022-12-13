import { Request, Response, Router } from "express";

import { startController } from "../controllers";
import { Templates } from "../types/template.paths";
import { logger } from "../utils/logger"


export const router: Router = Router();

/**
 * Simply renders a view template.
 *
 * @param template the template name
 */
const renderTemplate = (template: string) => (req: Request, res: Response) => {
  return res.render(template);
};

router.get("/", startController.get);
