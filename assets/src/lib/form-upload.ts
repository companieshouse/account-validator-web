/**
 * FormUploadArgs is a type representing a parameter object storing parameters needed to upload a form.
 * It is used by the uploadForm function. 
 * 
 * @param formId The ID of the form element in the HTML document. This is used to locate the form
 *               and gather its data for the upload process.
 * @param uploadEndpointOverride Optional parameter. It allows specifying a custom endpoint URL 
 *                               for the form submission. If not provided, the form's 'action' attribute is used.
 * @param onProgress Optional callback function that gets invoked during the upload process. 
 *                   It provides progress updates in the form of a number representing the percentage of completion.
 */
export interface FormUploadArgs {
    formId: string;
    uploadEndpointOverride?: string;
    onProgress?: (progress: number) => void;
}

/**
 * This function handles the process of uploading a form's data using an XMLHttpRequest. 
 * It allows for custom configuration of the upload process through the provided arguments.
 * The onProgress callback is called during the form upload with the percentage of the form that has been uploaded.
 * This can be used to implement progress indicators.
 * 
 * @param args An object of type FormUploadArgs containing:
 *             - formId: String representing the ID of the form element to be uploaded.
 *             - uploadEndpointOverride: (Optional) String specifying a custom endpoint for the form submission.
 *                                       If not provided, the form's 'action' attribute is used.
 *             - onProgress: (Optional) Callback function that is invoked with the upload progress (as a percentage).
 * @returns A Promise that resolves to a Response object containing the status, body, 
 *          and the XMLHttpRequest used for the upload. The promise rejects with an error in case of network issues.
 */
export function uploadForm(args: FormUploadArgs): Promise<Response> {
    // Deconstruct the args object to extract individual properties for easy access
    const { formId, uploadEndpointOverride, onProgress } = args;

    // Attempt to retrieve the form element from the DOM using its ID
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
        throw new Error(`Form with ID '${formId}' not found`);
    }

    const formData = new FormData(form);

    // Submit to the form's action attribute unless it's over-ridden be the function args.
    // If no action is provided it defaults to the current pages url.
    const uploadEndpoint = uploadEndpointOverride ?? form.action;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadEndpoint, true);
    xhr.setRequestHeader("Accept", "application/json");

    // If a progress callback is provided in the arguments, attach it to the XMLHttpRequest
    // As the form is uploaded this will call the callback with the percentage of the form that has been uploaded.
    // This can be used for progress indicators.
    if (onProgress !== undefined) {
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round(
                    (event.loaded / event.total) * 100
                );
                onProgress(percentComplete);
            }
        });
    }

    // Return a promise which resolves when the request has completed. 
    // If there is an error with the request, reject is called.
    // Calling resolve is the same as returning from an async function.
    // Calling reject is the same as throwing from an async function. 
    return new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
            resolve({
                status: xhr.status,
                body: xhr.responseText,
                xhr,
            });
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network Error"));
        });

        xhr.send(formData);
    });
}

export interface Response {
    status: number;
    body: string;
    xhr: XMLHttpRequest;
}
