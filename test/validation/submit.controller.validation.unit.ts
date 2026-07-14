jest.mock("../../src/utils/localise");

import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "../../src/config";
import { ErrorMessages } from "../../src/constants";
import { SubmittedFileValidationRequest, validateRequest } from "../../src/validation/submit.controller.validation";
import { SubmitPageRequest } from "../../src/controllers/submit.controller";
import { getLocalesField } from "../../src/utils/localise";

const zipFileHeader = "PK\u0003\u0004";

// Mock request object
const mockReq = {
    locals: {
        i18n: {
            no_file: ErrorMessages.NO_FILE,
            invalid_file_type: ErrorMessages.INVALID_FILE_TYPE,
            file_too_large: ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB)
        }
    }
} as unknown as SubmitPageRequest;

/**
 * Generic helper function to mock getLocalesField with a custom message
 * @param message The message to return from getLocalesField
 */
function mockLocalesMessage(message: string) {
    (getLocalesField as jest.Mock).mockReturnValue(message);
}

describe("File submission form validation", () => {

    // beforeEach(() => {
    //     jest.clearAllMocks();
    //     resetMockSession();
    // });
    it("Should allow zip files that are under the size limit", () => {
        const req: SubmittedFileValidationRequest = {
            file: {
                size: 42,
                firstBytes: `${zipFileHeader}halsjdfhlaksjdhjh`
            }
        };

        const validationResult = validateRequest(req, mockReq);

        expect(validationResult.hasErrors).toBe(false);
    });

    it("Should reject requests without files", () => {
        const req: SubmittedFileValidationRequest = {
            file: null
        };

        mockLocalesMessage("Select an accounts file.");

        const validationResult = validateRequest(req, mockReq);

        expect(validationResult.hasErrors).toBe(true);
        expect(validationResult.errors[0].text).toBe(ErrorMessages.NO_FILE);
    });

    it("Should reject files that are too large", () => {
        const req: SubmittedFileValidationRequest = {
            file: {
                size: MAX_FILE_SIZE + 1,
                firstBytes: `${zipFileHeader}hajsdfhsdf`
            }
        };

        mockLocalesMessage("The selected file must be smaller than ");
        const validationResult = validateRequest(req, mockReq);

        expect(validationResult.hasErrors).toBe(true);
        expect(validationResult.errors[0].text).toContain(ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
    });

    it("Should reject files that are not ZIPs or XML or HTML", () => {
        const req: SubmittedFileValidationRequest = {
            file: {
                size: MAX_FILE_SIZE + 1,
                firstBytes: `Not a valid file contents`
            }
        };

        mockLocalesMessage("The selected file must be a XHTML or ZIP.");
        const validationResult = validateRequest(req, mockReq);

        expect(validationResult.hasErrors).toBe(true);
        expect(validationResult.errors[0].text).toBe(ErrorMessages.INVALID_FILE_TYPE);
    });
});

