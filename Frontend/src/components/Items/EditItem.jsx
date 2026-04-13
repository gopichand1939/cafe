import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ItemForm from "./ItemForm";
import { ITEM_BY_ID, ITEM_UPDATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedItem = useSelector((state) => state.card.itemSelectedItem);
  const [item, setItem] = useState(selectedItem);
  const [isLoading, setIsLoading] = useState(!selectedItem);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Number(selectedItem?.id) === Number(id)) {
      setItem(selectedItem);
      setIsLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        const response = await fetchWithRefreshToken(ITEM_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch item");
        }

        setItem(data.data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch item");
        navigate("/items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate, selectedItem]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("id", payload.id);
      formData.append("category_id", payload.category_id);
      formData.append("item_name", payload.item_name);
      formData.append("item_description", payload.item_description);
      formData.append("is_active", payload.is_active);
      if (payload.item_image_file) {
        formData.append("item_image", payload.item_image_file);
      }

      const response = await fetchWithRefreshToken(ITEM_UPDATE, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update item");
      }

      toast.success("Item updated successfully");
      navigate("/items");
    } catch (error) {
      toast.error(error.message || "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="panel">Loading item...</div>;
  }

  return <ItemForm selectedItem={item} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}

export default EditItem;
