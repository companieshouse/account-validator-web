document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const submitBlock = document.getElementById("submit");
    const pendingBlock = document.getElementById("pending");
    const percentage = document.getElementById("percentage");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        submitBlock.classList.add("hidden");
        pendingBlock.classList.remove("hidden");

        const fileInput = document.getElementById("file");
        const file = fileInput.files[0];

        const xhr = new XMLHttpRequest();

        xhr.open("POST", event.target.action, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.upload.addEventListener("progress", function (event) {
            if (event.lengthComputable) {
                let percentComplete = Math.round(
                    (event.loaded / event.total) * 25
                ); // 25% is fully uploaded
                percentage.innerText = `${percentComplete}% complete`;
            }
        });

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                const fileId = result.fileId;

                const eventSource = new EventSource(
                    `{{Urls.RESULT}}/${fileId}/sse`
                );

                eventSource.addEventListener("message", function (event) {
                    const data = JSON.parse(event.data);

                    if (data.message === "{{timeoutMessage}}") {
                        window.location.href = "{{Urls.ERROR}}";
                    }

                    percentage.innerText = `${data.message.percent}% complete`;

                    if (data.message.percent === 100) {
                        window.location.href = `{{Urls.RESULT}}/${fileId}`;
                        eventSource.close();
                    }
                });
            }
        });

        const formData = new FormData();
        formData.append("file", file);

        xhr.send(formData);
    });
});
