import { Handler } from "express";
import { CHS_URL } from "../config";
import { Templates } from "../types/template.paths";

export const get: Handler = (req, res) => {
    return res.render(Templates.START, {
        CHS_URL,
        templateName: Templates.START,
    });
};
