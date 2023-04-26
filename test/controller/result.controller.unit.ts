import request from "supertest";
import app from '../../src/app';
import { accountValidatorService } from '../../src/services/account.validation.service';

jest.mock('../../src/services/account.validation.service');

describe('Result controller tests', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should render the results page', async () => {
        const fileId = 'file123';
        const mockResult = {
            status: 'success',
            fileName: 'success.xhtml',
            fileId: 'successs'
        };


        (accountValidatorService.check as jest.Mock).mockResolvedValue(mockResult);

        const response = await request(app)
            .get(`/xbrl_validate/result/${fileId}`);

        expect(response.status).toBe(200);
        expect(response.text).toContain('meets the iXBRL specification and business validation rules.');
        expect(response.text).toContain(mockResult.fileName);
    });
});
