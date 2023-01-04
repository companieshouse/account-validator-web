jest.mock("../../src/services/account.validation.service");

import { AccountValidationResult, accountValidatorService } from "../../src/services/account.validation.service";


const mockFiles: Record<string, AccountValidationResult> = {
    'success.xbrl': {
        status: 'success'
    },
    'success_with_image.xbrl': {
        status: 'success',
        imageUrl: 'image.jpeg'
    },
    'failure.xbrl': {
        status: 'failure',
        reasons: [ 'failure reason' ]
    }
};

export const mockedValidatorService = jest.mocked(accountValidatorService);
mockedValidatorService.submit.mockImplementation(async file => { // eslint-disable-line require-await
    const mockedFile = mockFiles[file.originalname];
    if (mockedFile === undefined) {
        throw `No mock file with name ${file.originalname}`;
    }
    return mockedFile;
});
