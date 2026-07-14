import { resetMockSession } from '../mocks/session.middleware.mock';
import request from "supertest";
import app from '../../src/app';
import { Urls } from "../../src/constants";

describe('Start controller tests', () => {
    beforeEach(() => {
        resetMockSession();
    });

    it('Should render the start page', async () => {
        const response = await request(app)
            .get(Urls.BASE.toString());

        expect(response.status).toBe(200);
    });
});
