import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageDropZone from "../common/ImageDropZone";
import { getImageUrl } from "../../Utils/imageUrl";
import { Button, Card, InputField, PageSection } from "../ui";

const getInitialFormState = (selectedCategory) => ({
  category_name: selectedCategory?.category_name || "",
  category_description: selectedCategory?.category_description || "",
  category_image: selectedCategory?.category_image || "",
  is_active:
    selectedCategory && typeof selectedCategory.is_active !== "undefined"
      ? Number(selectedCategory.is_active) === 1
      : true,
});

function CategoryForm({ selectedCategory, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormState(selectedCategory));
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    setFormData(getInitialFormState(selectedCategory));
    setErrors({});
    setPreviewUrl("");
    setSelectedFile(null);
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const imageLabel = useMemo(() => {
    if (selectedFile?.name) {
      return selectedFile.name;
    }

    if (!formData.category_image) {
      return "No image selected";
    }

    return formData.category_image;
  }, [formData.category_image, selectedFile]);

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleImageSelect = (file) => {
    if (!file) {
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFieldValue("category_image", file.name);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.category_name.trim()) {
      nextErrors.category_name = "Category name is required";
    }

    if (!formData.category_description.trim()) {
      nextErrors.category_description = "Category description is required";
    }

    if (!selectedFile && !selectedCategory?.category_image) {
      nextErrors.category_image = "Category image path is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event?.preventDefault?.();

    if (!validateForm()) {
      return;
    }

    onSubmit?.({
      id: selectedCategory?.id,
      category_name: formData.category_name.trim(),
      category_description: formData.category_description.trim(),
      category_image: formData.category_image.trim(),
      category_image_file: selectedFile,
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <div className="ui-page">
      <Card>
        <PageSection
          eyebrow="Category"
          title={selectedCategory ? "Edit Category" : "Create Category"}
          actions={
            <Button variant="secondary" onClick={() => navigate("/category")}>
              Back
            </Button>
          }
        />

        <form onSubmit={handleSubmit} className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <InputField
              label="Category Name"
              type="text"
              value={formData.category_name}
              onChange={(event) => setFieldValue("category_name", event.target.value)}
              placeholder="Enter category name"
              error={errors.category_name}
            />

            <InputField
              label="Description"
              as="textarea"
              rows="5"
              value={formData.category_description}
              onChange={(event) =>
                setFieldValue("category_description", event.target.value)
              }
              placeholder="Enter category description"
              className="min-h-[150px]"
              inputClassName="min-h-[150px] resize-y"
              error={errors.category_description}
            />

            <ImageDropZone
              label="Upload Category Image"
              imageLabel={imageLabel}
              error={errors.category_image}
              onFileSelect={handleImageSelect}
              onError={(message) => setErrors((prev) => ({ ...prev, category_image: message }))}
            />

            <InputField
              label="Stored Image Path"
              type="text"
              value={formData.category_image}
              readOnly
            />

              <div className="ui-field-shell">
                <span className="ui-label">Active Status</span>
                <button
                  type="button"
                  className={`ui-status-toggle ${formData.is_active ? "bg-success-bg text-success-text" : ""}`}
                  onClick={() => setFieldValue("is_active", !formData.is_active)}
                >
                  <span
                    className={`ui-status-toggle-dot ${
                      formData.is_active ? "bg-success-text" : "bg-text-muted/40"
                    }`}
                  />
                  <span className="text-[0.92rem] font-bold">
                    {formData.is_active ? "Active" : "Inactive"}
                  </span>
                </button>
              </div>
          </div>

          <aside className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="ui-label">Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[20px] border border-dashed border-border-subtle bg-surface-muted">
                {previewUrl ? (
                  <img src={previewUrl} alt="Category preview" className="h-full w-full object-cover" />
                ) : formData.category_image ? (
                  <img
                    src={getImageUrl(selectedCategory || { category_image: formData.category_image }, "category_image")}
                    alt="Category preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-text-muted">
                    <p>Choose an image to preview it here.</p>
                  </div>
                )}
              </div>

              <Card tone="subtle" padding="sm" className="grid gap-[2px]">
                <span className="ui-label">Selected file</span>
                <strong className="break-words text-[0.95rem] font-bold text-text-strong">{imageLabel}</strong>
              </Card>
            </div>
          </aside>

          <div className="flex flex-wrap gap-2.5 lg:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CategoryForm;
