import '../mocks/account.validator.service.mock';

import request from "supertest";
import app from '../../src/app';

describe("Start controller tests", () => {
    it('Should render the start page', async () => {
        const response = await request(app)
            .get('/xbrl_validate');

        expect(response.status).toBe(200);
    });

    it('Should reject post submissions with no file', async () => {
        const response = await request(app)
            .post('/xbrl_validate');

        expect(response.status).toBe(400);
        expect(response.text).toContain('No file selected. Upload an XBRL or ZIP file to be validated.');
    });

    it(`Should reject post submissions with a file that isn't XBRL or ZIP`, async () => {
        const response = await request(app)
            .post('/xbrl_validate')
            .attach('file', Buffer.from(''), { filename: 'not_xbrl.jpg' } );


        expect(response.status).toBe(400);
        expect(response.text).toContain('Uploaded file was not the correct type. Upload an XBRL or ZIP file to be validated.');
    });
});
