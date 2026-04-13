import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ItemForm from "./ItemForm";
import { ITEM_CREATE } from "../../Utils/Constant";

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
      if (payload.item_image_file) {
        formData.append("item_image", payload.item_image_file);
      }

      const response = await fetch(ITEM_CREATE, {
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
