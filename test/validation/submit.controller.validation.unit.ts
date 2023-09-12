import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "../../src/config";
import { ErrorMessages } from "../../src/constants";
import { SubmittedFileValidationRequest, validateRequest } from "../../src/validation/submit.controller.validation";

const zipFileHeader = "PK\u0003\u0004";

describe("File submission form validation", () => {
    it("Should allow zip files that are under the size limit", () => {
        const req: SubmittedFileValidationRequest = {
            file: {
                size: 42,
                firstBytes: `${zipFileHeader}halsjdfhlaksjdhjh`
            }
        };

        const validationResult = validateRequest(req);

        expect(validationResult.hasErrors).toBe(false);
    });

    it("Should reject requests without files", () => {
        const req: SubmittedFileValidationRequest = {
            file: null
        };

        const validationResult = validateRequest(req);

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

        const validationResult = validateRequest(req);

        expect(validationResult.hasErrors).toBe(true);
        expect(validationResult.errors[0].text).toBe(ErrorMessages.FILE_TOO_LARGE(MAX_FILE_SIZE_MB));
    });

    it("Should reject files that are not ZIPs or XML or HTML", () => {
        const req: SubmittedFileValidationRequest = {
            file: {
                size: MAX_FILE_SIZE + 1,
                firstBytes: `Not a valid file contents`
            }
        };

        const validationResult = validateRequest(req);

        expect(validationResult.hasErrors).toBe(true);
        expect(validationResult.errors[0].text).toBe(ErrorMessages.INVALID_FILE_TYPE);
    });
});
