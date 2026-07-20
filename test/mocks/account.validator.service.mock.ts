jest.mock("../../src/services/account.validation.service");

import { AccountValidationResult, accountValidatorService } from "../../src/services/account.validation.service";


const mockFiles: Record<string, AccountValidationResult> = {
    'success.xhtml': {
        status: 'success',
        fileName: 'success.xhtml',
        fileId: 'successs',
        percent: 0
    },
    'success_with_image.xhtml': {
        status: 'success',
        imageUrl: 'image.jpeg',
        fileName: 'success_with_image.xhtml',
        fileId: 'success_with_image',
        percent: 0
    },
    'failure_duplicate_facts.xhtml': {
        status: 'failure',
        fileId: 'failure_duplicate_facts',
        fileName: 'failure_duplicate_facts.xhtml',
        reasons: [ 'failure reason' ],
        percent: 0
    }
};

// Convert record from name key to ID key
const mockResponses = Object.values(mockFiles).reduce((acc, value) => {
    acc[value.fileId] = value;
    return acc;
}, {} as Record<string, AccountValidationResult>);

export const mockedValidatorService = jest.mocked(accountValidatorService);
mockedValidatorService.submit.mockImplementation(async file => { // eslint-disable-line require-await
    const mockedFile = mockFiles[file.originalname];
    if (mockedFile === undefined) {
        throw `No mock file with name ${file.originalname}`;
    }
    return mockedFile;
});


// eslint-disable-next-line require-await
mockedValidatorService.check.mockImplementation(async id => {
    const mockResponse = mockResponses[id];

    if (mockResponse === undefined) {
        throw `No mock response with id ${id}`;
    }

    return mockResponse;
});
