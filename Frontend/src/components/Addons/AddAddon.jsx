import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AddonForm from "./AddonForm";
import { ADDON_CREATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function AddAddon() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(ADDON_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to create addon");
      }

      toast.success("Addon created successfully");
      navigate("/addon");
    } catch (error) {
      toast.error(error.message || "Failed to create addon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <AddonForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} />;
}

export default AddAddon;
