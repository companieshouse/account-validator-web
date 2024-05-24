import { type SubmittedFileValidationRequest } from "../../src/validation/submit.controller.validation";
import { uploadForm } from "./lib/form-upload";

const SUBMIT_BLOCK_ID = "submit"; // HTML element id for the block of tags representing the submit page.
const PENDING_BLOCK_ID = "pending"; // HTML element id for the block of tags representing the pending page.
const PERCENTAGE_ID = "percentage"; // HTML element id for the block of tags representing the percentage complete on the pending page.
const DISPLAY_NONE_CSS_CLASS = "govuk-!-display-none"; // CSS class used to hide an element.
const ARIA_HIDDEN_ATTRIBUTE = "aria-hidden"; // Accessibility attribute used to tell screen readers that an elemnt is hidden.

// This type acts like an enum limiting the possible parameters to a set of strings.
// In this case it only allows page names to be either "submit" or "pending".
type PageName = "submit" | "pending";

/**
 * This function controls the visibility of different sections of the page based on the provided page name.
 * It uses the PageName type to determine which section to show and hide. The function dynamically manages
 * two main sections of the page, handling their display status according to the given page name.
 *
 * @param pageName A string parameter of type PageName that determines which page section to show.
 *                 Depending on the value, it switches the visibility of the sections identified by
 *                 their respective IDs (as defined in the PageName type).
 *                 - If 'submit' is provided, the submit section is shown and the pending section is hidden.
 *                 - If 'pending' is provided, the pending section is shown and the submit section is hidden.
 */
function showPage(pageName: PageName): void {
    const submitBlock = document.getElementById(SUBMIT_BLOCK_ID);
    const pendingBlock = document.getElementById(PENDING_BLOCK_ID);

    if (submitBlock && pendingBlock) {
        const [activeBlock, inactiveBlock] =
            pageName === "submit"
                ? [submitBlock, pendingBlock]
                : [pendingBlock, submitBlock];

        setVisibility(activeBlock, true);
        setVisibility(inactiveBlock, false);
    }
}

function setVisibility(element: HTMLElement, visible: boolean) {
    if (visible) {
        element.classList.remove(DISPLAY_NONE_CSS_CLASS);
        element.setAttribute(ARIA_HIDDEN_ATTRIBUTE, "false");
    } else {
        element.classList.add(DISPLAY_NONE_CSS_CLASS);
        element.setAttribute(ARIA_HIDDEN_ATTRIBUTE, "true");
    }
}

/**
 * Retrieves an HTML element by its ID and ensures that it actually exists in the DOM.
 * This is a strict utility function that enforces the presence of an element with the given ID.
 * If the element is not found, the function throws an error, preventing further execution of
 * code that depends on the existence of this element.
 *
 * @param id The ID of the HTML element to be retrieved. It is a string specifying the unique identifier
 *           assigned to the element in the HTML markup.
 * @returns The HTMLElement corresponding to the provided ID. The function guarantees that this element
 *          is not null, ensuring its presence in the document.
 * @throws An error if no element with the given ID is found in the document. This error handling
 *        ensures that any issues with missing elements are caught early and are clearly reported.
 */
function mustGetById(id: string): HTMLElement {
    const elem = document.getElementById(id);
    if (elem === null) {
        throw new Error(`Cannot find element with id '${id}'`);
    }

    return elem;
}

/**
 * Handles the error scenario during the uploading process. This function takes the response HTML string,
 * typically received from an HTTP response, and uses it to update the current webpage's content.
 * Specifically, it replaces the inner HTML of a specific element on the page (identified by SUBMIT_BLOCK_ID)
 * with new content derived from the response HTML. This is useful for updating the page with field error messages
 * returned from the server. It also resets the upload progress indicator to 0%.
 *
 * @param responseHTML A string containing HTML content, typically received as a response from the server
 *                     when an error occurs during the upload process. This HTML is used to update the
 *                     corresponding element on the current page.
 */
function handleErrorUploading(responseHTML: string): void {
    const parser = new DOMParser();
    // Parse the response HTML string into a document object for easy manipulation.
    const xhrDoc = parser.parseFromString(responseHTML, "text/html");

    // Retrieve the new content for the submit element from the parsed document
    const newSubmitElement = xhrDoc.querySelector(`#${SUBMIT_BLOCK_ID}`);
    // Retrieve the current submit element from the actual document.
    const currentSubmitElement = document.querySelector(`#${SUBMIT_BLOCK_ID}`);

    // If both elements are present, replace the inner HTML of the current element with the new content.
    // This updates the page with new information (like error messages) received from the server.
    if (currentSubmitElement && newSubmitElement) {
        currentSubmitElement.innerHTML = newSubmitElement.innerHTML;
        setPercentComplete(0);
    }
}

/**
 * Asynchronously validates a form by sending a file's metadata to a server endpoint for validation.
 * The function extracts the first file from the provided file input element and constructs a validation
 * request object. It then sends this object to a server endpoint for validation. If the server returns
 * a status of 400 (indicating a client error, typically bad input), the function retrieves and returns
 * the response text which contains HTML with the field error messages. Otherwise, it returns an empty string,
 * indicating that no error was found during validation.
 * This function allows for validation to be performed on the file without needing to upload the whole file.
 * This allows for quick validation feedback to the user.
 *
 * @param fileInput An HTMLInputElement that represents the file input on the form. It's expected to
 *                  contain the file that needs to be validated.
 * @returns A Promise that resolves to a string. If validation fails (response status 400),
 *          it returns the HTML containing the field error messages. Otherwise, it returns an empty string.
 */
async function validateForm(fileInput: HTMLInputElement): Promise<string> {
    const req: SubmittedFileValidationRequest = {
        file: null,
    };

    // Get the file from the input.
    // If there is no file, null will be submitted which will fail validation with
    // the error message indicating there was no file.
    const file = fileInput?.files?.[0];
    if (file) {
        req.file = {
            size: file.size,
            firstBytes: await getFirstBytes(file),
        };
    }

    // Submit to server
    const response = await fetch("/xbrl_validate/submit/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
    });

    // If validation fails return the HTML
    if (response.status === 400) {
        return await response.text();
    } else {
        return "";
    }
}

/**
 * Asynchronously reads the first 'n' bytes of a given file and returns them as a string.
 * This function uses the FileReader API to read a specified portion of the file. It's useful for
 * passing to the server to validate the file based upon it's starting bytes. For example a ZIP file starts with
 * PK\003\004 or PK\005\006
 * and an XML file starts with '<xml'.
 *
 * @param file The File object to be read. This object represents the actual file content to be processed.
 * @param n Optional parameter indicating the number of bytes to read from the start of the file.
 *          It defaults to 50 if not specified.
 * @returns A Promise that resolves to a string containing the first 'n' bytes of the file. If there's an
 *          error in reading the file, the promise is rejected with an error message.
 */
function getFirstBytes(file: File, n = 50): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e: ProgressEvent<FileReader>) {
            if (typeof e.target?.result === "string") {
                const firstBytes = e.target.result.substr(0, 50);
                resolve(firstBytes);
            } else {
                reject(new Error("Could not read file"));
            }
        };
        reader.onerror = reject;
        reader.readAsText(file.slice(0, n));
    });
}

/**
 * Sets the text content of the element with ID PERCENTAGE_ID
 * to display the given completion percentage.
 *
 * @param {number} percentComplete - The completion percentage, from 0 to 100.
 */
function setPercentComplete(percentComplete: number) {
    const percentageElement = mustGetById(PERCENTAGE_ID);
    percentageElement.innerText = `${percentComplete}% complete`;
}

/**
 * Callback used by the upload form to handle upload progress.
 * Maps the actual upload percentage to a discrete percentage
 * to display.
 *
 * Used as the onProgress callback for the upload form.
 *
 * @param {number} percentUploaded - The actual upload percentage
 * out of 100
 */
function handleUploadProgress(percentUploaded: number) {
    let percentComplete: number;

    if (percentUploaded < 12.5) {
        percentComplete = 5;
    } else if (percentUploaded < 24.9) {
        percentComplete = 12;
    } else {
        percentComplete = 25;
    }

    setPercentComplete(percentComplete);
}

/**
 * Redirects the browser to a given URL.
 *
 * Updates window.location.href to the provided URL string.
 *
 * Can be used to redirect on completion or when there is an error.
 *
 * @param {string} url - The URL to redirect the browser to.
 */
function redirect(url: string) {
    window.location.href = url;
}


/**
 * Interface defining the configuration parameters.
 *
 * @property {string} resultsBaseUrl - Base URL for results pages
 * @property {string} errorUrl - URL to redirect on errors
 * @property {string} fileInputFieldName - Upload form field name
 * @property {string} callbackUrlOnComplete - URL called on completion
 * @property {number} pollingIntervalMS - The interval between requests polling the progress of documantion validation
 * @property {number} timeoutMS - The time after which the validation will be considered an error.
*/
interface ConfigParams {
    resultsBaseUrl: string;
    progressCheckUrl: string
    errorUrl: string;
    fileInputFieldName: string;
    callbackUrlOnComplete: string;
    pollingIntervalMS: number;
    timeoutMS: number;
}

/**
 * Checks if an object conforms to the ConfigParams interface.
 * Useful for type checking in TypeScript.
 *
 * @param {any} obj - The object to check
 * @returns {obj is ConfigParams} True if obj satisfies interface
 */
function isConfigParams(obj: any): obj is ConfigParams {
    if (typeof obj !== "object" || obj === null) {
        return false;
    }

    const requiredProps = [
        "resultsBaseUrl",
        "progressCheckUrl",
        "errorUrl",
        "fileInputFieldName",
        "callbackUrlOnComplete",
        "pollingIntervalMS",
        "timeoutMS"
    ];

    return requiredProps.every((prop) => prop in obj);
}

/**
 * Interface for validation progress parameters.
 * Used as the parameter object for the startValidationProgress function.
 *
 * @extends ConfigParams
 * @property {string} fileId - The ID of the file being uploaded
 */
interface ValidationProgressParams extends ConfigParams {
    fileId: string;
}

/**
 * Initiates and manages the progress of a file validation process using server-sent events (SSE).
 * It establishes an EventSource connection to a specified URL and listens for messages indicating
 * the progress of the validation. If a timeout occurs, it redirects to an error URL. Upon completion
 * of the validation, it redirects to a specified callback URL or a results page, based on the
 * completion status and provided parameters.
 *
 * @param params An object of type ValidationProgressParams, containing:
 *               - fileId: The unique identifier for the file being validated.
 *               - resultsBaseUrl: The base URL where validation progress messages are sent from the server.
 *               - errorUrl: The URL to redirect to in case of an error (like timeout).
 *               - callbackUrlOnComplete: A URL to redirect to upon successful completion of validation.
 *                 If this is not provided, a default URL constructed from resultsBaseUrl and fileId is used.
 */
function startValidationProgress(params: ValidationProgressParams) {
    const {
        fileId,
        resultsBaseUrl,
        progressCheckUrl,
        callbackUrlOnComplete,
        errorUrl,
        pollingIntervalMS,
        timeoutMS
    } = params;


    const intervalTimer = setInterval(async () => {
        let percent: number;
        try {
            percent = await getValidationProgress(progressCheckUrl, fileId);
        } catch (e) {
            redirect(errorUrl);
            throw e; // Make TS happy. Even though it will never be reached.
        }

        setPercentComplete(percent);

        if (percent === 100) {
            const hasCallbackUrl = callbackUrlOnComplete !== "";
            const resultRedirect = hasCallbackUrl
                ? callbackUrlOnComplete.replace("{fileId}", fileId)
                : `${resultsBaseUrl}/${fileId}`;

            console.log(`Validation complete. Redirecting to ${resultRedirect}`);
            redirect(resultRedirect);
            return;
        }
    }, pollingIntervalMS);

    setTimeout(() => {
        clearTimeout(intervalTimer);
        redirect(errorUrl);
    }, timeoutMS);
}

async function getValidationProgress(progressCheckUrl: string, fileId: string): Promise<number> {
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const resp = await fetch(`${progressCheckUrl}/${fileId}`);
            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }
            const data = await resp.json();
            return data.progress;
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed: ${error.message}`);
            retries += 1;
            if (retries === MAX_RETRIES) {
                throw new Error('Max retries reached, unable to fetch validation progress.');
            }
        }
    }

    throw new Error('Unexpected error');
}

/**
 * Interface representing the response structure after a successful form upload.
 * This is used to type-check and access the response data in a consistent manner.
 */
interface UploadResponse {
    fileId: string;
}

/**
 * Asynchronously handles the submission of a form, including validation, upload, and subsequent
 * validation progress tracking. It performs initial checks and validation, then proceeds to upload
 * the form. Based on the upload response, it either handles errors or starts tracking the validation progress.
 *
 * @param formId The ID of the form element that is being submitted.
 * @param configParams Configuration parameters including URLs for error handling, file input field name,
 *                     and callback URL for when the upload and validation are complete.
 * @throws Redirects to the error URL specified in configParams if any errors occur during form validation
 *         or upload, or if the response status from the upload is not as expected.
 */
export async function submitForm(formId: string, configParams: ConfigParams) {
    const { errorUrl, fileInputFieldName } = configParams;

    if (!isConfigParams(configParams)) {
        const msg = `Submit form arguments are of the wrong type. Args: ${JSON.stringify(
            configParams
        )}`;
        console.error(msg);
        redirect(errorUrl);
        return;
    }

    const fileInput = document.getElementById(fileInputFieldName);
    if (fileInput === null) {
        const msg = `Unable to find file input`;
        console.error(msg);
        redirect(errorUrl);
        return;
    }

    const resp = await validateForm(fileInput as HTMLInputElement);
    if (resp !== "") {
        handleErrorUploading(resp);
        return;
    }

    try {
        showPage("pending");

        const { status, body } = await uploadForm({
            formId,
            onProgress: handleUploadProgress,
        });

        switch (status) {
                case 200: {
                    const responseData = JSON.parse(body) as UploadResponse;

                    startValidationProgress({
                        fileId: responseData.fileId,
                        ...configParams,
                    });
                    return;
                }
                case 400:
                    console.error(`Error uploading file: ${status}`);

                    handleErrorUploading(body);

                    showPage("submit");
                    break;
                case 500:
                    // falls through
                default:
                    console.error(`Received unexpected response status when uploading form. Status: ${status}`);
                    redirect(errorUrl);
                    break;
        }
    } catch (error: any) {
        showPage("submit");
        console.error(`Error uploading form '#${formId}': ${error.message}`);
    }
}

// Tell typescript that the window object can have a function called submitForm which has the same type as teh submitForm function.
declare global {
    interface Window {
        submitForm: typeof submitForm;
    }
}

// This line actually adds the 'submitForm' function to the global window object.
// This makes 'submitForm' accessible from other script tags in the HTML document, not just within the module or file where it's defined.
// It's a way of exporting the function to a broader scope, allowing it to be called like a global function in the browser environment.
window.submitForm = submitForm;
