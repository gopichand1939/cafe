import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AddonForm from "./AddonForm";
import { ADDON_BY_ID, ADDON_UPDATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function EditAddon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedAddon = useSelector((state) => state.card.addonSelectedItem);
  const [addon, setAddon] = useState(selectedAddon);
  const [isLoading, setIsLoading] = useState(!selectedAddon);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Number(selectedAddon?.id) === Number(id)) {
      setAddon(selectedAddon);
      setIsLoading(false);
      return;
    }

    const fetchAddon = async () => {
      try {
        const response = await fetchWithRefreshToken(ADDON_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch addon");
        }

        setAddon(data.data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch addon");
        navigate("/addon");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddon();
  }, [id, navigate, selectedAddon]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(ADDON_UPDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update addon");
      }

      toast.success("Addon updated successfully");
      navigate("/addon");
    } catch (error) {
      toast.error(error.message || "Failed to update addon");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading addon...</div>;
  }

  return <AddonForm selectedAddon={addon} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}

export default EditAddon;
