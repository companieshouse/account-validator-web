import { Response, Router, Request } from "express";
import { handleErrors } from "../middleware/error.handler";
import { imageRenderService } from "../services/image.render.service";
import { logger } from "../utils/logger";

export const renderController = Router({ mergeParams: true });

async function renderPDF(req: Request, res: Response) {
    const fileId = req.params['id'];

    const imageRenderFile = await imageRenderService.render(fileId);
    logger.debug(`Image Render has rendered the requested file.`);
    res.contentType(imageRenderFile.mimeType);
    res.send(Buffer.from(imageRenderFile.body));
}

renderController.get('/', handleErrors(renderPDF));
