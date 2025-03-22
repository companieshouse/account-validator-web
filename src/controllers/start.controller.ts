import { Templates } from "../constants";
import { Request, Response, Router } from "express";

export const startController = Router();

startController.get('/', (req: Request, res: Response) => {

    return res.render(Templates.START, {
        templateName: Templates.START,
    });
});
