import { resetMockSession } from "../mocks/session.middleware.mock";
import request from "supertest";
import app from '../../src/app';
import { imageRenderService } from "../../src/services/image.render.service";
import { File } from "private-api-sdk-node/dist/services/file-transfer/types";

jest.mock('../../src/services/image.render.service');


describe('Result controller tests', () => {
    afterEach(() => {
        jest.resetAllMocks();
        resetMockSession();
    });

    it('should return pdf buffer', async () => {
        const fileId = 'file123';
        const body = "";
        const mockResult: File = {
            fileName: "",
            body: body,
            mimeType: "application/pdf",
            size: 0,
            extension: "pdf"
        };


        (imageRenderService.render as jest.Mock).mockResolvedValue(mockResult);

        const response = await request(app)
            .get(`/xbrl_validate/render/${fileId}`);

        expect(response.status).toBe(200);
        expect(response.header?.["content-type"]).toBe(mockResult.mimeType);
        expect(response.body.toString()).toBe("");
        expect(response.header?.["content-length"]).toBe("0");
    });
});
