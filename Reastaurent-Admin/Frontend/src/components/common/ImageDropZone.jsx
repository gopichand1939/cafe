import { useId, useState } from "react";

const getFileNameFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").filter(Boolean).pop();
    return name || "dropped-image";
  } catch (_error) {
    return "dropped-image";
  }
};

const getImageFileFromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();

  if (!response.ok || !blob.type.startsWith("image/")) {
    throw new Error("Drop an image file or use a direct image URL.");
  }

  return new File([blob], getFileNameFromUrl(url), { type: blob.type });
};

const getExternalImageUrl = (dataTransfer) => {
  const html = dataTransfer.getData("text/html");
  const uriList = dataTransfer.getData("text/uri-list");
  const plainText = dataTransfer.getData("text/plain");
  const htmlImageSrc = html?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const candidate = htmlImageSrc || uriList || plainText;

  if (!candidate) {
    return "";
  }

  const firstUrl = candidate
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));

  return /^(https?:\/\/|data:image\/)/i.test(firstUrl || "") ? firstUrl : "";
};

function ImageDropZone({ label, imageLabel, onFileSelect, onError, error }) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingExternalImage, setIsLoadingExternalImage] = useState(false);

  const selectImageFile = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError?.("Please choose an image file.");
      return;
    }

    onFileSelect?.(file);
  };

  const handleFilePick = (event) => {
    selectImageFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = Array.from(event.dataTransfer.files || []).find((item) =>
      item.type.startsWith("image/")
    );

    if (file) {
      selectImageFile(file);
      return;
    }

    const externalImageUrl = getExternalImageUrl(event.dataTransfer);

    if (!externalImageUrl) {
      onError?.("Drop an image file here, or click Browse files to upload one.");
      return;
    }

    setIsLoadingExternalImage(true);

    try {
      selectImageFile(await getImageFileFromUrl(externalImageUrl));
    } catch (_error) {
      onError?.(
        "That source blocked direct image drop. Save the image locally, then upload or drag the file here."
      );
    } finally {
      setIsLoadingExternalImage(false);
    }
  };

  return (
    <div className="grid gap-2">
      <span className="text-[0.92rem] font-semibold text-slate-600">{label}</span>
      <div
        className={`grid min-h-[172px] place-items-center rounded-[14px] border-2 border-dashed px-5 py-6 text-center transition ${
          isDragging
            ? "border-orange-500 bg-orange-50 shadow-[0_16px_34px_rgba(249,115,22,0.16)]"
            : "border-slate-300 bg-[#fffaf5]"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="grid justify-items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl shadow-[0_10px_22px_rgba(15,23,42,0.12)]">
            <span aria-hidden="true">+</span>
          </div>
          <div>
            <p className="m-0 text-[1rem] font-bold text-slate-900">
              {isLoadingExternalImage ? "Importing image..." : "Drag and drop image here"}
            </p>
            <p className="mt-1 mb-0 text-[0.88rem] text-slate-500">
              Drop from your computer, or try dragging a direct image from another source.
            </p>
          </div>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={handleFilePick}
          />
          <label
            className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-[0.9rem] font-bold text-white"
            htmlFor={inputId}
          >
            Browse files
          </label>
        </div>
      </div>
      <small className="text-slate-500">{imageLabel}</small>
      {error ? <small className="text-red-600">{error}</small> : null}
    </div>
  );
}

export default ImageDropZone;
