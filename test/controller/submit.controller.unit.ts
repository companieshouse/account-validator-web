import { mockSession, resetMockSession } from '../mocks/session.middleware.mock';
import { mockedValidatorService } from '../mocks/account.validator.service.mock';

import request from "supertest";
import app from '../../src/app';
import { Urls, FILE_UPLOAD_FIELD_NAME, ErrorMessages, PACKAGE_TYPE_KEY } from '../../src/constants';
import { AccountValidationResult } from '../../src/services/account.validation.service';
import { COOKIE_NAME, COOKIE_SECRET, MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from '../../src/config';
import { SubmittedFileValidationRequest } from '../../src/validation/submit.controller.validation';
import { getSessionRequest } from '../mocks/session.mock';

describe("Submit controller tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        resetMockSession();
    });

    const zipFileMagicBytes = "PK\u0003\u0004";

    it("Should render the submit page", async () => {
        const response = await getRequestWithCookie(Urls.SUBMIT);

        expect(response.status).toBe(200);

        const fileUploadHtml = `<input class="govuk-file-upload" id="file" name="file" type="file">`;
        expect(response.text).toContain(fileUploadHtml);
        const hiddenPendingPage = `id="pending" class="govuk-grid-row govuk-!-display-none"`;
        expect(response.text).toContain(hiddenPendingPage);
        const submitUrl = `action="/xbrl_validate/submit"`;
        expect(response.text).toContain(submitUrl);
    });

    it("Should render with the max file size notice the same as MAX_FILE_SIZE_MB", async () => {
        const response = await getRequestWithCookie(Urls.SUBMIT);

        expect(response.status).toBe(200);

        const sizeLimitNotice = `${MAX_FILE_SIZE_MB}MB`;
        expect(response.text).toContain(sizeLimitNotice);
    });

    it("Should render the submit page with package type uksef", async () => {
        Object.assign(mockSession, getSessionRequest());
        const response = await getRequestWithCookie(Urls.SUBMIT + "/?packageType=uksef");

        expect(response.status).toBe(200);

        const fileUploadHtml = `<input class="govuk-file-upload" id="file" name="file" type="file">`;
        expect(response.text).toContain(fileUploadHtml);
        const hiddenPendingPage = `id="pending" class="govuk-grid-row govuk-!-display-none"`;
        expect(response.text).toContain(hiddenPendingPage);
        const submitUrl = `action="/xbrl_validate/submit?packageType=uksef"`;
        expect(response.text).toContain(submitUrl);
    });

    it("Should render the submit page with package type group-package-401", async () => {
        Object.assign(mockSession, getSessionRequest());
        const response = await getRequestWithCookie(Urls.SUBMIT + "/?packageType=group-package-401");

        expect(response.status).toBe(200);

        const fileUploadHtml = `<input class="govuk-file-upload" id="file" name="file" type="file">`;
        expect(response.text).toContain(fileUploadHtml);
        const hiddenPendingPage = `id="pending" class="govuk-grid-row govuk-!-display-none"`;
        expect(response.text).toContain(hiddenPendingPage);
        const submitUrl = `action="/xbrl_validate/submit?packageType=group-package-401"`;
        expect(response.text).toContain(submitUrl);
    });

    it("Should render the submit page with package type group-package-5 not signed in", async () => {

        const response = await getRequestWithCookie(Urls.SUBMIT + "/?packageType=group-package-5");

        expect(response.status).toBe(302);
    });

    it("Should render the submit page with package type group-package-5", async () => {
        Object.assign(mockSession, getSessionRequest());
        const response = await getRequestWithCookie(Urls.SUBMIT + "/?packageType=group-package-5");

        expect(response.status).toBe(500);
    });

    it("Should return 200 OK and no HTML when validating a file input", async () => {
        const payload: SubmittedFileValidationRequest = {
            file: {
                size: 42,
                firstBytes: zipFileMagicBytes
            }
        };

        const response = await request(app)
            .post(Urls.SUBMIT_VALIDATE)
            .set("Cookie", setCookie())
            .send(payload)
            .set('Content-Type', 'application/json');

        expect(response.status).toBe(200);
    });

    it("Should return 400 when validting and there is no file", async () => {
        const payload: SubmittedFileValidationRequest = {
            file: null
        };

        const response = await request(app)
            .post(Urls.SUBMIT_VALIDATE)
            .set("Cookie", setCookie())
            .send(payload)
            .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.text).toContain(ErrorMessages.NO_FILE);
    });

    it("Should return 400 when validting and the file is too big", async () => {
        const payload: SubmittedFileValidationRequest = {
            file: {
                size: MAX_FILE_SIZE + 1,
                firstBytes: zipFileMagicBytes
            }
        };

        const response = await request(app)
            .post(Urls.SUBMIT_VALIDATE).set("Cookie", setCookie())
            .send(payload)
            .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.text).toContain(ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
    });

    it("Should return 400 when validting and the file not a valid type", async () => {
        const payload: SubmittedFileValidationRequest = {
            file: {
                size: 42,
                firstBytes: "Not a ZIP or HTML file"
            }
        };

        const response = await request(app)
            .post(Urls.SUBMIT_VALIDATE).set("Cookie", setCookie())
            .send(payload)
            .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.text).toContain(ErrorMessages.INVALID_FILE_TYPE);
    });

    it("Should return file ID as JSON when successfully submitted", async () => {
        const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
        const mockValue = { status: 'pending', fileId: '12345', fileName: '' };
        mockSubmit.mockResolvedValue(mockValue as AccountValidationResult);

        const response = await request(app)
            .post(Urls.SUBMIT).set("Cookie", setCookie())
            .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(`PK\u0003\u0004`), { filename: 'test_file.zip' });

        expect(response.status).toBe(200);
        const resp = JSON.parse(response.text);
        expect(resp).toHaveProperty('fileId');
        expect(resp.fileId).toBe(mockValue.fileId);
    });


    it('Should reject post submissions with no file', async () => {
        const response = await request(app)
            .post(Urls.SUBMIT).set("Cookie", setCookie())
            .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from([]));

        expect(response.status).toBe(400);
        expect(response.text).toContain(ErrorMessages.NO_FILE);
    });

    it('Should error when package type is not valid', async () => {
        Object.assign(mockSession, getSessionRequest());
        mockSession.setExtraData(PACKAGE_TYPE_KEY, "uksef");
        const response = await getRequestWithCookie(Urls.SUBMIT + "/?packageType=not_valid");
        expect(response.status).toBe(500);
    });

    it('Should error when package type query does not match session', async () => {

        Object.assign(mockSession, getSessionRequest());
        mockSession.setExtraData(PACKAGE_TYPE_KEY, "welsh");
        const response = await request(app)
            .post(Urls.SUBMIT + "/?packageType=uksef").set("Cookie", setCookie())
            .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(`PK\u0003\u0004`), { filename: 'test_file.zip' });
        expect(response.status).toBe(500);
    });

    it('Should pass when package type query does match session', async () => {

        const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
        const mockValue = { status: 'pending', fileId: '12345', fileName: '' };
        mockSubmit.mockResolvedValue(mockValue as AccountValidationResult);

        Object.assign(mockSession, getSessionRequest());
        mockSession.setExtraData(PACKAGE_TYPE_KEY, "uksef");
        const response = await request(app)
            .post(Urls.SUBMIT + "/?packageType=uksef").set("Cookie", setCookie())
            .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(`PK\u0003\u0004`), { filename: 'test_file.zip' });
        expect(response.status).toBe(200);
    });

    // it(`Should reject post submissions with a file that isn't XBRL or ZIP`, async () => {
    //     const response = await request(app)
    //         .post(Urls.SUBMIT)
    //         .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(''), { filename: 'not_xbrl.jpg' } );


    //     expect(response.status).toBe(400);
    //     expect(response.text).toContain('The selected file must be a XHTML or ZIP.');
    // });

    // it('Should call accountValidatorService.submit with the correct file', async () => {
    //     const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
    //     mockSubmit.mockResolvedValue({ status: 'pending', fileId: '12345', fileName: '' } as AccountValidationResult);

    //     await request(app)
    //         .post(Urls.SUBMIT)
    //         .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(''), { filename: 'test_file.zip' });

    //     expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
    //         originalname: 'test_file.zip'
    //     }));

    //     mockSubmit.mockRestore();
    // });

    // it('Should return the fileID on successful submission', async () => {
    //     const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
    //     mockSubmit.mockResolvedValue({ status: 'pending', fileId: '12345', fileName: '' } as AccountValidationResult);

    //     const response = await request(app)
    //         .post(Urls.SUBMIT)
    //         .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(''), { filename: 'test_file.zip' });

    //     expect(response.status).toBe(200);
    //     expect(response.body.fileId).toBe('12345');

    //     mockSubmit.mockRestore();
    // });

    // it('Should handle errors from accountValidatorService.submit', async () => {
    //     const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
    //     mockSubmit.mockRejectedValue(new Error('API error'));

    //     const response = await request(app)
    //         .post(Urls.SUBMIT)
    //         .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from(''), { filename: 'test_file.zip' });

    //     expect(response.status).toBe(500);

    //     mockSubmit.mockRestore();
    // });

    // it('Should handle max file size error', async () => {
    //     // Mock the validator service to return an error
    //     const mockSubmit = jest.spyOn(mockedValidatorService, 'submit');
    //     mockSubmit.mockRejectedValue(new multer.MulterError('LIMIT_FILE_SIZE'));

    //     // We make a POST request to the server with a large file
    //     const response = await request(app)
    //         .post(Urls.SUBMIT)
    //         .attach(FILE_UPLOAD_FIELD_NAME, Buffer.from('A'.repeat(MAX_FILE_SIZE + 1)), { filename: 'large_file.zip' });

    //     // The server should respond with a 400 error
    //     expect(response.status).toBe(400);
    //     // And the error message should mention the maximum file size
    //     const maxSizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
    //     expect(response.text).toContain(`The selected file must be smaller than ${maxSizeMB}MB`);

    //     mockSubmit.mockRestore();
    // });
});

function getRequestWithCookie(uri: string, agent = app) {
    return request.agent(agent).set("Cookie", setCookie()).get(uri);
}


export const setCookie = () => {
    return [COOKIE_NAME + '=' + COOKIE_SECRET];
};
