import { type SubmittedFileValidationRequest } from "../../src/validation/submit.controller.validation";
import { uploadForm } from "./lib/form-upload";

const SUBMIT_BLOCK_ID = "submit";
const PENDING_BLOCK_ID = "pending";
const PERCENTAGE_ID = "percentage";
const DISPLAY_NONE_CSS_CLASS = "govuk-!-display-none";
const ARIA_HIDDEN_ATTRIBUTE = "aria-hidden";

type PageName = "submit" | "pending";

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

function mustGetById(id: string): HTMLElement {
    const elem = document.getElementById(id);
    if (elem === null) {
        throw new Error(`Cannot find element with id '${id}'`);
    }

    return elem;
}

function handleErrorUploading(responseHTML: string): void {
    const parser = new DOMParser();
    const xhrDoc = parser.parseFromString(responseHTML, "text/html");

    const newSubmitElement = xhrDoc.querySelector(`#${SUBMIT_BLOCK_ID}`);
    const currentSubmitElement = document.querySelector(`#${SUBMIT_BLOCK_ID}`);

    if (currentSubmitElement && newSubmitElement) {
        currentSubmitElement.innerHTML = newSubmitElement.innerHTML;
        setPercentComplete(0);
    }
}

async function validateForm(fileInput: HTMLInputElement): Promise<string> {
    const req: SubmittedFileValidationRequest = {
        file: null,
    };

    const file = fileInput?.files?.[0];
    if (file) {
        req.file = {
            size: file.size,
            firstBytes: await getFirstBytes(file),
        };
    }

    const response = await fetch("/xbrl_validate/submit/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
    });

    if (response.status === 400) {
        return await response.text();
    } else {
        return "";
    }
}

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

function setVisibility(element: HTMLElement, visible: boolean) {
    if (visible) {
        element.classList.remove(DISPLAY_NONE_CSS_CLASS);
        element.setAttribute(ARIA_HIDDEN_ATTRIBUTE, "false");
    } else {
        element.classList.add(DISPLAY_NONE_CSS_CLASS);
        element.setAttribute(ARIA_HIDDEN_ATTRIBUTE, "true");
    }
}

function setPercentComplete(percentComplete: number) {
    const percentageElement = mustGetById(PERCENTAGE_ID);
    percentageElement.innerText = `${percentComplete}% complete`;
}

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

function redirect(errorUrl: string) {
    console.error(`Error occured while uploading file`);
    window.location.href = errorUrl;
}

interface ConfigParams {
    resultsBaseUrl: string;
    errorUrl: string;
    timeoutMessage: string;
    fileInputFieldName: string;
    callbackUrlOnComplete: string;
}

function isConfigParams(obj: any): obj is ConfigParams {
    if (typeof obj !== "object" || obj === null) {
        return false;
    }

    const requiredProps = [
        "resultsBaseUrl",
        "errorUrl",
        "timeoutMessage",
        "fileInputFieldName",
        "callbackUrlOnComplete",
    ];
    const stringProps = requiredProps.every(
        (prop) => typeof obj[prop] === "string"
    );

    return stringProps && requiredProps.every((prop) => prop in obj);
}

interface ValidationProgressParams extends ConfigParams {
    fileId: string;
}

function startValidationProgress(params: ValidationProgressParams) {
    const {
        fileId,
        resultsBaseUrl,
        timeoutMessage,
        errorUrl,
        callbackUrlOnComplete,
    } = params;

    const eventSource = new EventSource(`${resultsBaseUrl}/${fileId}/sse`);

    eventSource.addEventListener("message", function (event: MessageEvent) {
        const data = JSON.parse(event.data);

        if (data.message === timeoutMessage) {
            redirect(errorUrl);
            return;
        }

        setPercentComplete(data.message.percent);

        if (data.message.percent === 100) {
            const hasCallbackUrl = callbackUrlOnComplete !== "";
            const resultRedirect = hasCallbackUrl
                ? callbackUrlOnComplete.replace("{fileId}", fileId)
                : `${resultsBaseUrl}/${fileId}`;
            redirect(resultRedirect);
            return;
        }
    });
}

interface UploadResponse {
    fileId: string;
}

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
                    redirect(errorUrl);
                    break;
        }
    } catch (error: any) {
        showPage("submit");
        console.error(`Error uploading form '#${formId}': ${error.message}`);
    }
}

declare global {
    interface Window {
        submitForm: typeof submitForm;
    }
}

// Make it accessible from other script tags
window.submitForm = submitForm;
