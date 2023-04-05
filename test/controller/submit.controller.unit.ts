import { mockedValidatorService } from '../mocks/account.validator.service.mock';

import request from "supertest";
import app from '../../src/app';
import { Urls } from '../../src/constants';

describe("Submit controller tests", () => {
    it('Should reject post submissions with no file', async () => {
        const response = await request(app)
            .post(Urls.SUBMIT);

        expect(response.status).toBe(400);
        expect(response.text).toContain('Select an accounts file.');
    });

    it(`Should reject post submissions with a file that isn't XBRL or ZIP`, async () => {
        const response = await request(app)
            .post(Urls.SUBMIT)
            .attach('file', Buffer.from(''), { filename: 'not_xbrl.jpg' } );


        expect(response.status).toBe(400);
        expect(response.text).toContain('The selected file must be a XHTML or ZIP.');
    });

    it('Should call accountValidatorService.submit with the correct file', async () => {
        const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
        mockSubmit.mockResolvedValue({ status: 'pending', fileId: '12345', fileName: '' });

        await request(app)
            .post(Urls.SUBMIT)
            .attach('file', Buffer.from(''), { filename: 'test_file.zip' });

        expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
            originalname: 'test_file.zip'
        }));

        mockSubmit.mockRestore();
    });

    it('Should redirect to the result page with the fileId after successful validation', async () => {
        const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
        mockSubmit.mockResolvedValue({ status: 'pending', fileId: '12345', fileName: '' });

        const response = await request(app)
            .post(Urls.SUBMIT)
            .attach('file', Buffer.from(''), { filename: 'test_file.zip' });

        expect(response.status).toBe(302);
        expect(response.header.location).toEqual(`${Urls.RESULT}/12345`);

        mockSubmit.mockRestore();
    });

    it('Should handle errors from accountValidatorService.submit', async () => {
        const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
        mockSubmit.mockRejectedValue(new Error('API error'));

        const response = await request(app)
            .post(Urls.SUBMIT)
            .attach('file', Buffer.from(''), { filename: 'test_file.zip' });

        expect(response.status).toBe(500);

        mockSubmit.mockRestore();
    });
});
