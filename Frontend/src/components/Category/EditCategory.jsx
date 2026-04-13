import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CategoryForm from "./CategoryForm";
import { CATEGORY_BY_ID, CATEGORY_UPDATE } from "../../Utils/Constant";

function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedCategory = useSelector((state) => state.card.categorySelectedItem);
  const [category, setCategory] = useState(selectedCategory);
  const [isLoading, setIsLoading] = useState(!selectedCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Number(selectedCategory?.id) === Number(id)) {
      setCategory(selectedCategory);
      setIsLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        const response = await fetch(CATEGORY_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch category");
        }

        setCategory(data.data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch category");
        navigate("/category");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id, navigate, selectedCategory]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("id", payload.id);
      formData.append("category_name", payload.category_name);
      formData.append("category_description", payload.category_description);
      formData.append("is_active", payload.is_active);
      if (payload.category_image_file) {
        formData.append("category_image", payload.category_image_file);
      }

      const response = await fetch(CATEGORY_UPDATE, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update category");
      }

      toast.success("Category updated successfully");
      navigate("/category");
    } catch (error) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="panel">Loading category...</div>;
  }

  return (
    <CategoryForm
      selectedCategory={category}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

export default EditCategory;
