import { type SubmittedFileValidationRequest } from "../../src/validation/submit.controller.validation";

const FORM_SELECTOR = "form";
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

/**
 * This function swaps the existing submit block with a new one that may include field validation errors.
 *
 * @param {XMLHttpRequest} xhr
 */
function handleErrorUploading(
    responseHTML: string,
    args: SetupFormArguments
): void {
    const parser = new DOMParser();
    const xhrDoc = parser.parseFromString(responseHTML, "text/html");

    const newSubmitElement = xhrDoc.querySelector(`#${SUBMIT_BLOCK_ID}`);
    const currentSubmitElement = document.querySelector(`#${SUBMIT_BLOCK_ID}`);

    if (currentSubmitElement && newSubmitElement) {
        currentSubmitElement.innerHTML = newSubmitElement.innerHTML;

        // Since we are replacing the html we need to also re-setup the form
        setupForm(args);

        const percentage = mustGetById(PERCENTAGE_ID);
        percentage.innerText = `0% complete`;
    }
}

type SetupFormArguments = {
    resultsUrl: string;
    errorUrl: string;
    timeoutMessage: string;
    fileInputFieldName: string;
};

function setupForm(args: SetupFormArguments): void {
    const {
        resultsUrl,
        errorUrl,
        timeoutMessage,
    } = args;
        
    const form = document.querySelector(FORM_SELECTOR);
    if (form === null) {
        throw new Error("Unable to find form.");
    }

    const percentage = mustGetById(PERCENTAGE_ID);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fileInput = mustGetById(args.fileInputFieldName) as HTMLInputElement;
        const formData = new FormData();
        if (fileInput.files !== null && fileInput.files.length > 0) {
            formData.append(args.fileInputFieldName, fileInput.files[0]);
        } 

        const formHTML = await validateForm(fileInput);
        if (formHTML !== "") {
            handleErrorUploading(formHTML, args);
            return;
        }

        showPage("pending");

        const xhr = new XMLHttpRequest();
        const formAction =
            event.target instanceof HTMLFormElement
                ? event.target.action
                : null;
        if (formAction === null) {
            throw new Error(
                "The event target is not an instance of HTMLFormElement."
            );
        }

        xhr.open("POST", formAction, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.upload.addEventListener("progress", function (event) {
            if (!event.lengthComputable) {
                // Cannot determine the progress.
                return;
            }

            let percentComplete = Math.round((event.loaded / event.total) * 25); // 25% is fully uploaded

            if (percentComplete < 12.5) {
                percentComplete = 5;
            } else if (percentComplete < 24.9) {
                percentComplete = 12;
            } else {
                percentComplete = 25;
            }

            percentage.innerText = `${percentComplete}% complete`;
        });

        xhr.addEventListener("load", () => {
            switch (xhr.status) {
                case 200:
                    const result = JSON.parse(xhr.responseText);
                    const fileId = result.fileId;

                    const eventSource = new EventSource(
                        `${resultsUrl}/${fileId}/sse`
                    );

                    eventSource.addEventListener(
                        "message",
                        function (event: MessageEvent) {
                            const data = JSON.parse(event.data);

                            if (data.message === timeoutMessage) {
                                window.location.href = errorUrl;
                            }

                            percentage.innerText = `${data.message.percent}% complete`;

                            if (data.message.percent === 100) {
                                window.location.href = `${resultsUrl}/${fileId}`;
                                eventSource.close();
                            }
                        }
                    );
                    break;
                case 400:
                    console.error(`Error uploading file: ${xhr.statusText}`);
                    console.log(xhr.responseText);

                    handleErrorUploading(xhr.responseText, args);

                    showPage("submit");
                    break;
                case 500:
                // Fallthrough
                default:
                    console.error(`Error occured while uploading file`);
                    window.location.href = errorUrl;
                    break;
            }
        });

        xhr.send(formData);
    });
}


async function validateForm(
    fileInput: HTMLInputElement,
): Promise<string> {
    const req: SubmittedFileValidationRequest = {
        file: null
    }

    const file = fileInput?.files?.[0];
    if (file) {
        req.file = {
            size: file.size,
            firstBytes: await getFirstBytes(file),
        }
    } 

    const response = await fetch("/xbrl_validate/submit/validate", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req), 
    });

    if (response.status === 400) {
        return await response.text();
    } else {
        return "";
    }
}

async function getFirstBytes(file: File, n = 50): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e: ProgressEvent<FileReader>) {
            if (typeof e.target?.result === "string") {
                const firstBytes= e.target.result.substr(0, 50);
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


// Make it accessible from other script tags
//@ts-ignore
window.setupForm = setupForm;