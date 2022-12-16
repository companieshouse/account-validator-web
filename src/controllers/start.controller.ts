import { Request, Response } from "express";
import { CHS_URL, PIWIK_START_GOAL_ID, EWF_URL } from "../config";
import { Templates } from "../types/template.paths";

export const get = (req: Request, res: Response) => {
    return res.render(Templates.START, {
        CHS_URL,
        PIWIK_START_GOAL_ID,
        EWF_URL,
        templateName: Templates.START,
    });
};
