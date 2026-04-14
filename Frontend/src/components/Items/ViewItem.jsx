import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BACKEND_BASE_URL, ITEM_BY_ID } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setItemSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../../components/common/KeyValueDisplay";

function ViewItem() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedItem = useSelector((state) => state.card.itemSelectedItem);
  const [item, setItem] = useState(selectedItem);

  useEffect(() => {
    if (Number(selectedItem?.id) === Number(id)) {
      setItem(selectedItem);
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
        dispatch(setItemSelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch item");
        navigate("/items");
      }
    };

    fetchItem();
  }, [dispatch, id, navigate, selectedItem]);

  if (!item) {
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading item...</div>;
  }

  const displayData = {
    id: item.id,
    category_id: item.category_id,
    category_name: item.category_name || "-",
    item_name: item.item_name || "-",
    item_description: item.item_description || "-",
    item_image: item.item_image || "-",
    is_active: Number(item.is_active) === 1 ? "Active" : "Inactive",
    created_at: new Date(item.created_at).toLocaleString(),
    updated_at: new Date(item.updated_at).toLocaleString(),
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Items</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">View Item</h2>
        </div>
        <button className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/items")}>
          Back
        </button>
      </div>

      <div className="mt-[18px] rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} />
          </div>
          <aside className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Category Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[8px] border border-dashed border-slate-300 bg-[#fffaf5]">
                <img
                  src={`/images/${item.category_image}`}
                  alt={item.category_name || "Category"}
                  className="h-full min-h-[240px] max-h-[280px] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = `https://placehold.co/600x360?text=${encodeURIComponent(
                      item.category_name || "Category"
                    )}`;
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Item Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[8px] border border-dashed border-slate-300 bg-[#fffaf5]">
                <img
                  src={`${BACKEND_BASE_URL}/images/${item.item_image}`}
                  alt={item.item_name}
                  className="h-full min-h-[240px] max-h-[280px] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = `https://placehold.co/600x360?text=${encodeURIComponent(
                      item.item_name
                    )}`;
                  }}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ViewItem;
