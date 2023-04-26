import { Templates } from "../constants";
import { Router } from "express";

export const startController = Router();

startController.get('/', (req, res) => {
    return res.render(Templates.START, {
        templateName: Templates.START,
    });
});
