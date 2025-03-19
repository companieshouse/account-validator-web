import request from "supertest";
import app from '../../src/app';
import { accountValidatorService } from '../../src/services/account.validation.service';

jest.mock("ioredis");
jest.mock('../../src/services/account.validation.service');

describe('Result controller tests', () => {
    afterEach(() => {
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    it("Should return 404 if no fileId in path", async () => {
        const response = await request(app)
            .get(`/xbrl_validate/progress`);

        expect(response.status).toBe(404);
    });

    it("Should return the progress of the validation result", async () => {
        const fileId = 'file123';
        const mockResult = {
            status: 'success',
            fileName: 'success.xhtml',
            fileId: 'successs',
            percent: 35,
        };

        (accountValidatorService.check as jest.Mock).mockResolvedValue(mockResult);

        const response = await request(app)
            .get(`/xbrl_validate/progress/${fileId}`);


        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({ progress: 35 });
    });

    it("Should return status 500 if error is thrown", async () => {
        const fileId = 'file123';

        (accountValidatorService.check as jest.Mock).mockRejectedValue(new Error('An error'));

        const response = await request(app)
            .get(`/xbrl_validate/progress/${fileId}`);


        expect(response.status).toBe(500);
    });
});
