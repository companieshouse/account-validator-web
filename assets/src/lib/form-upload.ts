export interface FormUploadArgs {
    formId: string;
    uploadEndpointOverride?: string;
    onProgress?: (progress: number) => void;
}

export function uploadForm(args: FormUploadArgs): Promise<Response> {
    const { formId, uploadEndpointOverride, onProgress } = args;

    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
        throw new Error(`Form with ID '${formId}' not found`);
    }

    const formData = new FormData(form);

    const uploadEndpoint = uploadEndpointOverride ?? form.action;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadEndpoint, true);
    xhr.setRequestHeader("Accept", "application/json");

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
