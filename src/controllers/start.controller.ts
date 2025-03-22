import { Templates } from "../constants";
import { Request, Response, Router } from "express";

export const startController = Router();

startController.get('/', (req: Request, res: Response) => {

    console.log("NSDBG startController enter/render");
    return res.render(Templates.START, {
        templateName: Templates.START,
    });
});
