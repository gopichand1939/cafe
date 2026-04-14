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
    <div className="grid gap-6">
      <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Category</p>
            <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">{selectedCategory ? "Edit Category" : "Create Category"}</h2>
          </div>
          <button
            className="min-w-[92px] self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900"
            type="button"
            onClick={() => navigate("/category")}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Category Name</span>
              <input
                type="text"
                value={formData.category_name}
                onChange={(event) => setFieldValue("category_name", event.target.value)}
                placeholder="Enter category name"
                className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.category_name ? <small className="text-red-600">{errors.category_name}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Description</span>
              <textarea
                rows="5"
                value={formData.category_description}
                onChange={(event) =>
                  setFieldValue("category_description", event.target.value)
                }
                placeholder="Enter category description"
                className="min-h-[150px] w-full resize-y rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
              {errors.category_description ? (
                <small className="text-red-600">{errors.category_description}</small>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Upload Category Image</span>
              <input className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none" type="file" accept="image/*" onChange={handleImagePick} />
              <small className="text-slate-500">{imageLabel}</small>
              {errors.category_image ? <small className="text-red-600">{errors.category_image}</small> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Stored Image Path</span>
              <input className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none" type="text" value={formData.category_image} readOnly />
            </label>

            {selectedCategory ? (
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
              <span className="text-[0.92rem] font-semibold text-slate-600">Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[8px] border border-dashed border-slate-300 bg-[#fffaf5]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Category preview" className="h-full w-full object-cover" />
                ) : formData.category_image ? (
                  <img
                    src={`${BACKEND_BASE_URL}/images/${formData.category_image}`}
                    alt="Category preview"
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

export default CategoryForm;
