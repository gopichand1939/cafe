import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ItemForm from "./ItemForm";
import { ITEM_CREATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function AddItem() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category_id", payload.category_id);
      formData.append("item_name", payload.item_name);
      formData.append("item_description", payload.item_description);
      formData.append("price", payload.price);
      formData.append("is_popular", payload.is_popular);
      formData.append("is_new", payload.is_new);
      formData.append("is_veg", payload.is_veg);
      if (payload.discount_price != null) {
        formData.append("discount_price", payload.discount_price);
      }
      if (payload.preparation_time != null) {
        formData.append("preparation_time", payload.preparation_time);
      }
      if (payload.item_image_file) {
        formData.append("item_image", payload.item_image_file);
      }

      const response = await fetchWithRefreshToken(ITEM_CREATE, {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to create item");
      }

      toast.success("Item created successfully");
      navigate("/items");
    } catch (error) {
      toast.error(error.message || "Failed to create item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <ItemForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} />;
}

export default AddItem;
