import { Handler } from "express";
import { CHS_URL, PIWIK_START_GOAL_ID } from "../config";
import { Templates } from "../types/template.paths";

export const get: Handler = (req, res) => {
    return res.render(Templates.START, {
        CHS_URL,
        PIWIK_START_GOAL_ID,
        templateName: Templates.START,
    });
};
