import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL, CATEGORY_GET } from "../../Utils/Constant";

const getInitialFormState = (selectedItem) => ({
  category_id: selectedItem?.category_id ? String(selectedItem.category_id) : "",
  item_name: selectedItem?.item_name || "",
  item_description: selectedItem?.item_description || "",
  item_image: selectedItem?.item_image || "",
  is_active:
    selectedItem && typeof selectedItem.is_active !== "undefined"
      ? Number(selectedItem.is_active) === 1
      : true,
});

function ItemForm({ selectedItem, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormState(selectedItem));
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setFormData(getInitialFormState(selectedItem));
    setErrors({});
    setPreviewUrl("");
    setSelectedFile(null);
  }, [selectedItem]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(CATEGORY_GET);
        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch categories");
        }

        setCategories(data.data || []);
      } catch (_error) {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

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

    if (!formData.item_image) {
      return "No image selected";
    }

    return formData.item_image;
  }, [formData.item_image, selectedFile]);

  const selectedCategoryData = useMemo(
    () =>
      categories.find(
        (category) => String(category.id) === String(formData.category_id)
      ) || null,
    [categories, formData.category_id]
  );

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
    setFieldValue("item_image", file.name);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.category_id) {
      nextErrors.category_id = "Category is required";
    }

    if (!formData.item_name.trim()) {
      nextErrors.item_name = "Item name is required";
    }

    if (!formData.item_description.trim()) {
      nextErrors.item_description = "Item description is required";
    }

    if (!selectedFile && !selectedItem?.item_image) {
      nextErrors.item_image = "Item image path is required";
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
      id: selectedItem?.id,
      category_id: Number(formData.category_id),
      item_name: formData.item_name.trim(),
      item_description: formData.item_description.trim(),
      item_image: formData.item_image.trim(),
      item_image_file: selectedFile,
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <div className="form-page">
      <div className="panel form-panel">
        <div className="form-title-row">
          <div>
            <p className="eyebrow">Items</p>
            <h2>{selectedItem ? "Edit Item" : "Create Item"}</h2>
          </div>
          <button
            className="secondary-btn form-header-back-btn"
            type="button"
            onClick={() => navigate("/items")}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-main-column">
            <label className="field">
              <span>Category</span>
              <select
                value={formData.category_id}
                onChange={(event) => setFieldValue("category_id", event.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id ? <small>{errors.category_id}</small> : null}
            </label>

            <label className="field">
              <span>Item Name</span>
              <input
                type="text"
                value={formData.item_name}
                onChange={(event) => setFieldValue("item_name", event.target.value)}
                placeholder="Enter item name"
              />
              {errors.item_name ? <small>{errors.item_name}</small> : null}
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows="5"
                value={formData.item_description}
                onChange={(event) =>
                  setFieldValue("item_description", event.target.value)
                }
                placeholder="Enter item description"
              />
              {errors.item_description ? <small>{errors.item_description}</small> : null}
            </label>

            <label className="field">
              <span>Upload Item Image</span>
              <input type="file" accept="image/*" onChange={handleImagePick} />
              <small className="hint">{imageLabel}</small>
              {errors.item_image ? <small>{errors.item_image}</small> : null}
            </label>

            <label className="field">
              <span>Stored Image Path</span>
              <input type="text" value={formData.item_image} readOnly />
            </label>

            {selectedItem ? (
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
              <span>Category Preview</span>
              <div className="image-upload-box image-upload-box-compact">
                {selectedCategoryData?.category_image ? (
                  <img
                    src={`${BACKEND_BASE_URL}/images/${selectedCategoryData.category_image}`}
                    alt={selectedCategoryData.category_name}
                    className="preview-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    <p>Select category to preview it here.</p>
                  </div>
                )}
              </div>

              <div className="preview-meta-card">
                <span className="preview-meta-label">Selected category</span>
                <strong className="preview-meta-value">
                  {selectedCategoryData?.category_name || "No category selected"}
                </strong>
              </div>
            </div>

            <div className="field">
              <span>Item Image Preview</span>
              <div className="image-upload-box image-upload-box-compact">
                {previewUrl ? (
                  <img src={previewUrl} alt="Item preview" className="preview-image" />
                ) : formData.item_image ? (
                  <img
                    src={`${BACKEND_BASE_URL}/images/${formData.item_image}`}
                    alt="Item preview"
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

export default ItemForm;
