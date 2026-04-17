import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ADDON_BY_ID } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setAddonSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../../components/common/KeyValueDisplay";

function ViewAddon() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedAddon = useSelector((state) => state.card.addonSelectedItem);
  const [addon, setAddon] = useState(selectedAddon);

  useEffect(() => {
    if (Number(selectedAddon?.id) === Number(id)) {
      setAddon(selectedAddon);
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
        dispatch(setAddonSelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch addon");
        navigate("/addon");
      }
    };

    fetchAddon();
  }, [dispatch, id, navigate, selectedAddon]);

  if (!addon) {
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading addon...</div>;
  }

  const displayData = {
    id: addon.id,
    item_id: addon.item_id,
    item_name: addon.item_name || "-",
    addon_group: addon.addon_group || "-",
    addon_name: addon.addon_name || "-",
    addon_price: addon.addon_price != null ? `£${Number(addon.addon_price).toFixed(2)}` : "£0.00",
    sort_order: addon.sort_order != null ? addon.sort_order : 0,
    is_active: Number(addon.is_active) === 1 ? "Active" : "Inactive",
    created_at: new Date(addon.created_at).toLocaleString(),
    updated_at: new Date(addon.updated_at).toLocaleString(),
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Addon</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">View Addon</h2>
        </div>
        <button className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/addon")}>
          Back
        </button>
      </div>

      <div className="mt-[18px] rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <KeyValueDisplay data={displayData} />
      </div>
    </div>
  );
}

export default ViewAddon;
