import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL } from "../../Utils/Constant";

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

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];

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
    <div className="form-page">
      <div className="panel form-panel">
        <div className="form-title-row">
          <div>
            <p className="eyebrow">Category</p>
            <h2>{selectedCategory ? "Edit Category" : "Create Category"}</h2>
          </div>
          <button
            className="secondary-btn form-header-back-btn"
            type="button"
            onClick={() => navigate("/category")}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-main-column">
            <label className="field">
              <span>Category Name</span>
              <input
                type="text"
                value={formData.category_name}
                onChange={(event) => setFieldValue("category_name", event.target.value)}
                placeholder="Enter category name"
              />
              {errors.category_name ? <small>{errors.category_name}</small> : null}
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows="5"
                value={formData.category_description}
                onChange={(event) =>
                  setFieldValue("category_description", event.target.value)
                }
                placeholder="Enter category description"
              />
              {errors.category_description ? (
                <small>{errors.category_description}</small>
              ) : null}
            </label>

            <label className="field">
              <span>Upload Category Image</span>
              <input type="file" accept="image/*" onChange={handleImagePick} />
              <small className="hint">{imageLabel}</small>
              {errors.category_image ? <small>{errors.category_image}</small> : null}
            </label>

            <label className="field">
              <span>Stored Image Path</span>
              <input type="text" value={formData.category_image} readOnly />
            </label>

            {selectedCategory ? (
              <label className="toggle-field">
                <span>Active Status</span>
                <button
                  type="button"
                  className={formData.is_active ? "toggle on" : "toggle"}
                  onClick={() => setFieldValue("is_active", !formData.is_active)}
                >
                  <span />
                  {formData.is_active ? "Active" : "Inactive"}
                </button>
              </label>
            ) : null}
          </div>

          <aside className="form-side-column">
            <div className="field">
              <span>Image Preview</span>
              <div className="image-upload-box image-upload-box-compact">
                {previewUrl ? (
                  <img src={previewUrl} alt="Category preview" className="preview-image" />
                ) : formData.category_image ? (
                  <img
                    src={`${BACKEND_BASE_URL}/images/${formData.category_image}`}
                    alt="Category preview"
                    className="preview-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    <p>Choose an image to preview it here.</p>
                  </div>
                )}
              </div>

              <div className="preview-meta-card">
                <span className="preview-meta-label">Selected file</span>
                <strong className="preview-meta-value">{imageLabel}</strong>
              </div>
            </div>
          </aside>

          <div className="button-row field-full form-actions-row">
            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryForm;
