import { Templates } from "../constants";
import { Router } from "express";

export const errorController = Router();

errorController.get('/', (req, res) => {
    return res.render(Templates.ERROR, {
        templateName: Templates.ERROR,
    });
});
