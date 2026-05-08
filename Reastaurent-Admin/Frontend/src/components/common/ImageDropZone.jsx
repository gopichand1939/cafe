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

function ImageDropZone({
  label,
  imageLabel,
  onFileSelect,
  onError,
  error,
  compact = false,
}) {
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
    <div className="ui-field-shell min-w-0 overflow-hidden">
      <span className="ui-label">{label}</span>
      <div
        className={`grid min-w-0 place-items-center overflow-hidden border border-dashed text-center transition-all duration-200 ${
          compact
            ? "min-h-[126px] rounded-[16px] px-4 py-4"
            : "min-h-[190px] rounded-[22px] px-5 py-6"
        } ${
          isDragging
            ? "border-emerald-400 bg-emerald-50 shadow-[0_16px_30px_rgba(16,185,129,0.14)]"
            : "border-slate-200 bg-slate-50/80 hover:border-emerald-300 hover:bg-white"
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
        <div className={`grid min-w-0 max-w-full justify-items-center ${compact ? "gap-2" : "gap-3"}`}>
          <div
            className={`grid place-items-center rounded-full bg-white text-emerald-600 shadow-[0_10px_22px_rgba(15,23,42,0.10)] ${
              compact ? "h-10 w-10 text-xl" : "h-14 w-14 text-2xl"
            }`}
          >
            <span aria-hidden="true">+</span>
          </div>
          <div className="min-w-0 max-w-full">
            <p className={`m-0 max-w-full text-wrap font-extrabold text-slate-950 ${compact ? "text-[0.9rem]" : "text-[1rem]"}`}>
              {isLoadingExternalImage ? "Importing image..." : "Drag and drop image here"}
            </p>
            <p className={`mt-1 mb-0 max-w-full text-wrap text-slate-500 ${compact ? "text-[0.76rem] leading-5" : "text-[0.88rem] leading-6"}`}>
              Drop an image, or choose a file from your device.
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
            className="ui-button ui-button-secondary ui-button-sm cursor-pointer rounded-full border-slate-200 bg-white px-4 shadow-none"
            htmlFor={inputId}
          >
            Browse files
          </label>
        </div>
      </div>
      <small className="ui-help-text block max-w-full overflow-hidden break-all">{imageLabel}</small>
      {error ? <small className="ui-error-text">{error}</small> : null}
    </div>
  );
}

export default ImageDropZone;
