import request from "supertest";
import app from '../../src/app';
import { Urls } from "../../src/constants";

jest.mock("ioredis");

describe('Start controller tests', () => {
    it('Should render the start page', async () => {
        const response = await request(app)
            .get(Urls.BASE.toString());

        expect(response.status).toBe(200);
    });
});
