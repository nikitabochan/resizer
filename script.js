$(document).ready(function () {
    const fileInput = $("#fileInput");
    const sizeSelect = $("#sizeSelect");
    const preview = $("#preview");
    const resizeBtn = $("#resizeBtn");
    const rotateLeftBtn = $("#rotateLeftBtn");
    const rotateRightBtn = $("#rotateRightBtn");

    let cropper;
    let PDFDocument;

    let fileIndex = 0;

    function readFile(input, index) {
        if (input.files && input.files[index]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const file = input.files[index];
                if (file.type === "application/pdf") {
                    renderPDF(e.target.result);
                } else {
                    preview.attr("src", e.target.result);
                    initCropper();
                }
            };
            reader.readAsDataURL(input.files[index]);
        }
    }

    function init() {
        PDFDocument = window['pdf-lib'].PDFDocument;
    }

    function renderPDF(dataURL) {
        const loadingTask = pdfjsLib.getDocument(dataURL);
        loadingTask.promise.then(function (pdf) {
            pdf.getPage(1).then(function (page) {
                const scale = 5;
                const viewport = page.getViewport({ scale: scale, highQuality: true });
    
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const pixelRatio = window.devicePixelRatio || 1;
                canvas.width = viewport.width * pixelRatio;
                canvas.height = viewport.height * pixelRatio;
                canvas.style.width = viewport.width + "px";
                canvas.style.height = viewport.height + "px";
                ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport,
                };
    
                page.render(renderContext).promise.then(function () {
                    preview.attr("src", canvas.toDataURL());
                    initCropper();
                });
            });
        });
    }

    function getSelectedSize() {
        const selectedOption = sizeSelect.find("option:selected");
        const value = selectedOption.val();
        const dimensions = value.split("x").map(parseFloat);
        return {
            width: dimensions[0],
            height: dimensions[1],
        };
    }

    function initCropper() {
        if (cropper) {
            cropper.destroy();
        }
        const size = getSelectedSize();
        const aspectRatio = size.width / size.height;
        cropper = new Cropper(preview[0], {
            aspectRatio: aspectRatio,
            viewMode: 1,
            autoCropArea: aspectRatio,
        });
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    fileInput.change(function () {
        fileIndex = 0;
        readFile(this, fileIndex);
    });

    sizeSelect.change(function () {
        initCropper();
    });

    rotateLeftBtn.click(function () {
        if (!cropper) {
            return;
        }
        cropper.rotate(-90);
    });

    rotateRightBtn.click(function () {
        if (!cropper) {
            return;
        }
        cropper.rotate(90);
    });

    resizeBtn.click(function () {
        if (!cropper) {
            return;
        }
        const mimeType = fileInput[0].files[fileIndex].type;
        const extension = mimeType.split("/")[1];
        cropper.getCroppedCanvas().toBlob((blob) => {
            downloadBlob(blob, `resized_${fileIndex}.png`);

            // Proceed to the next image if there are more images
            if (fileInput[0].files.length > fileIndex + 1) {
                fileIndex++;
                readFile(fileInput[0], fileIndex);
            } else {
                // Reset the fileIndex if there are no more images
                fileIndex = 0;
            }
        }, mimeType, 0.95, 400); //400dpi
    });
});
