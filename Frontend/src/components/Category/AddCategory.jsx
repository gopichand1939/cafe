import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CategoryForm from "./CategoryForm";
import { CATEGORY_CREATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function AddCategory() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category_name", payload.category_name);
      formData.append("category_description", payload.category_description);
      if (payload.category_image_file) {
        formData.append("category_image", payload.category_image_file);
      }

      const response = await fetchWithRefreshToken(CATEGORY_CREATE, {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to create category");
      }

      toast.success("Category created successfully");
      navigate("/category");
    } catch (error) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <CategoryForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} />;
}

export default AddCategory;
