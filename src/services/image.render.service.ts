import PrivateApiClient from "private-api-sdk-node/dist/client";
import { Resource } from "@companieshouse/api-sdk-node";
import { createPrivateApiKeyClient } from "./api.service";
import { File } from "private-api-sdk-node/dist/services/file-transfer/types";


export interface ImageRenderService {
    render(id: string): Promise<File>
}

export class ImageRender implements ImageRenderService {

    /**
     * Constructor for the AccountValidator class
     * @param privateApiClient The API client to use for making requests. This parameter is for dependency injection.
     * The default value is automatically configured from the environment.
     */
    constructor(
        private privateApiClient: PrivateApiClient = createPrivateApiKeyClient(),
    ) {}

    async render(id: string): Promise<File> {
        const onlyAllowedMimeType = "application/pdf";
        const accountValidatorService = this.privateApiClient.accountValidatorService;
        const accountValidatorResponse =
            await accountValidatorService.getRenderedPDF(id);

        if (accountValidatorResponse.httpStatusCode !== 200) {
            throw accountValidatorResponse;
        }

        const file = (accountValidatorResponse as Resource<File>).resource;

        if (file && file.mimeType === onlyAllowedMimeType) {
            return file;
        }
        throw new Error('Failed to render PDF');
    }
}

export const imageRenderService = new ImageRender();
