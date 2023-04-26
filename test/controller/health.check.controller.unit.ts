import request from "supertest";
import app from '../../src/app';
import { Urls } from "../../src/constants";

describe('Health check controller tests', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return 200', async () => {
        const response = await request(app)
            .get(Urls.HEALTH_CHECK);

        expect(response.status).toBe(200);
        expect(response.text).toEqual("OK");
    });
});
