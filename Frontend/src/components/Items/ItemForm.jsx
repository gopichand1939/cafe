import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL, CATEGORY_GET } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import ImageDropZone from "../common/ImageDropZone";

const getInitialFormState = (selectedItem) => ({
  category_id: selectedItem?.category_id ? String(selectedItem.category_id) : "",
  item_name: selectedItem?.item_name || "",
  item_description: selectedItem?.item_description || "",
  item_image: selectedItem?.item_image || "",
  price: selectedItem?.price != null ? String(selectedItem.price) : "",
  discount_price: selectedItem?.discount_price != null ? String(selectedItem.discount_price) : "",
  preparation_time: selectedItem?.preparation_time != null ? String(selectedItem.preparation_time) : "",
  is_popular:
    selectedItem && typeof selectedItem.is_popular !== "undefined"
      ? Number(selectedItem.is_popular) === 1
      : false,
  is_new:
    selectedItem && typeof selectedItem.is_new !== "undefined"
      ? Number(selectedItem.is_new) === 1
      : false,
  is_veg:
    selectedItem && typeof selectedItem.is_veg !== "undefined"
      ? Number(selectedItem.is_veg) === 1
      : true,
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
        const response = await fetchWithRefreshToken(CATEGORY_GET);
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

  const handleImageSelect = (file) => {
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

    if (formData.price !== "" && (isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
      nextErrors.price = "Price must be a valid positive number";
    }

    if (formData.discount_price !== "" && (isNaN(Number(formData.discount_price)) || Number(formData.discount_price) < 0)) {
      nextErrors.discount_price = "Discount price must be a valid positive number";
    }

    if (formData.preparation_time !== "" && (isNaN(Number(formData.preparation_time)) || Number(formData.preparation_time) < 0)) {
      nextErrors.preparation_time = "Preparation time must be a valid positive number";
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
      price: formData.price !== "" ? parseFloat(formData.price) : 0,
      discount_price: formData.discount_price !== "" ? parseFloat(formData.discount_price) : null,
      preparation_time: formData.preparation_time !== "" ? parseInt(formData.preparation_time, 10) : null,
      is_popular: formData.is_popular ? 1 : 0,
      is_new: formData.is_new ? 1 : 0,
      is_veg: formData.is_veg ? 1 : 0,
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Items</p>
            <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">{selectedItem ? "Edit Item" : "Create Item"}</h2>
          </div>
          <button
            className="min-w-[92px] self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900"
            type="button"
            onClick={() => navigate("/items")}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Category</span>
              <select
                value={formData.category_id}
                onChange={(event) => setFieldValue("category_id", event.target.value)}
                className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id ? <small className="text-red-600">{errors.category_id}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Item Name</span>
              <input
                type="text"
                value={formData.item_name}
                onChange={(event) => setFieldValue("item_name", event.target.value)}
                placeholder="Enter item name"
                className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.item_name ? <small className="text-red-600">{errors.item_name}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Description</span>
              <textarea
                rows="5"
                value={formData.item_description}
                onChange={(event) =>
                  setFieldValue("item_description", event.target.value)
                }
                placeholder="Enter item description"
                className="min-h-[150px] w-full resize-y rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.item_description ? <small className="text-red-600">{errors.item_description}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Price (£)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(event) => setFieldValue("price", event.target.value)}
                placeholder="e.g. 5.95"
                className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.price ? <small className="text-red-600">{errors.price}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Discount Price (£)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discount_price}
                onChange={(event) => setFieldValue("discount_price", event.target.value)}
                placeholder="e.g. 4.50 (leave empty for no discount)"
                className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.discount_price ? <small className="text-red-600">{errors.discount_price}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Preparation Time (minutes)</span>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.preparation_time}
                onChange={(event) => setFieldValue("preparation_time", event.target.value)}
                placeholder="e.g. 25"
                className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.preparation_time ? <small className="text-red-600">{errors.preparation_time}</small> : null}
            </label>

            <ImageDropZone
              label="Upload Item Image"
              imageLabel={imageLabel}
              error={errors.item_image}
              onFileSelect={handleImageSelect}
              onError={(message) => setErrors((prev) => ({ ...prev, item_image: message }))}
            />

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Stored Image Path</span>
              <input className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none" type="text" value={formData.item_image} readOnly />
            </label>

            <div className="flex flex-wrap gap-4">
              <label className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">Popular</span>
                <button
                  type="button"
                  className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${formData.is_popular ? "bg-amber-50 text-amber-800" : "bg-white text-slate-700"}`}
                  onClick={() => setFieldValue("is_popular", !formData.is_popular)}
                >
                  <span className={`h-6 w-6 rounded-full ${formData.is_popular ? "bg-amber-500" : "bg-slate-400"}`} />
                  {formData.is_popular ? "Popular" : "Not Popular"}
                </button>
              </label>

              <label className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">New Item</span>
                <button
                  type="button"
                  className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${formData.is_new ? "bg-blue-50 text-blue-800" : "bg-white text-slate-700"}`}
                  onClick={() => setFieldValue("is_new", !formData.is_new)}
                >
                  <span className={`h-6 w-6 rounded-full ${formData.is_new ? "bg-blue-500" : "bg-slate-400"}`} />
                  {formData.is_new ? "NEW" : "Not New"}
                </button>
              </label>

              <label className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">Veg / Non-Veg</span>
                <button
                  type="button"
                  className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${formData.is_veg ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                  onClick={() => setFieldValue("is_veg", !formData.is_veg)}
                >
                  <span className={`h-6 w-6 rounded-full ${formData.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                  {formData.is_veg ? "Veg 🟢" : "Non-Veg 🔴"}
                </button>
              </label>
            </div>

            {selectedItem ? (
              <label className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">Active Status</span>
                <button
                  type="button"
                  className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${formData.is_active ? "bg-emerald-50 text-green-800" : "bg-white text-slate-700"}`}
                  onClick={() => setFieldValue("is_active", !formData.is_active)}
                >
                  <span className={`h-6 w-6 rounded-full ${formData.is_active ? "bg-green-500" : "bg-slate-400"}`} />
                  {formData.is_active ? "Active" : "Inactive"}
                </button>
              </label>
            ) : null}
          </div>

          <aside className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Category Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[8px] border border-dashed border-slate-300 bg-[#fffaf5]">
                {selectedCategoryData?.category_image ? (
                  <img
                    src={`${BACKEND_BASE_URL}/images/${selectedCategoryData.category_image}`}
                    alt={selectedCategoryData.category_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-600">
                    <p>Select category to preview it here.</p>
                  </div>
                )}
              </div>

              <div className="grid gap-[6px] rounded-[8px] border border-slate-200 bg-white p-[14px]">
                <span className="text-[0.86rem] font-semibold text-slate-500">Selected category</span>
                <strong className="break-words text-[0.95rem] text-slate-800">
                  {selectedCategoryData?.category_name || "No category selected"}
                </strong>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Item Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[8px] border border-dashed border-slate-300 bg-[#fffaf5]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Item preview" className="h-full w-full object-cover" />
                ) : formData.item_image ? (
                  <img
                    src={`${BACKEND_BASE_URL}/images/${formData.item_image}`}
                    alt="Item preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-600">
                    <p>Choose an image to preview it here.</p>
                  </div>
                )}
              </div>

              <div className="grid gap-[6px] rounded-[8px] border border-slate-200 bg-white p-[14px]">
                <span className="text-[0.86rem] font-semibold text-slate-500">Selected file</span>
                <strong className="break-words text-[0.95rem] text-slate-800">{imageLabel}</strong>
              </div>
            </div>
          </aside>

          <div className="flex flex-wrap gap-2.5 lg:col-span-2">
            <button className="rounded-[8px] border-0 bg-orange-500 px-4 py-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemForm;
