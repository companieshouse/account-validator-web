jest.mock("../../src/services/account.validation.service");

import { AccountValidationResult, accountValidatorService } from "../../src/services/account.validation.service";


const mockFiles: Record<string, AccountValidationResult> = {
    'success.xhtml': {
        status: 'success',
        fileId: ''
    },
    'success_with_image.xhtml': {
        status: 'success',
        imageUrl: 'image.jpeg',
        fileId: ''
    },
    'failure_duplicate_facts.xhtml': {
        status: 'failure',
        fileId: '',
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
