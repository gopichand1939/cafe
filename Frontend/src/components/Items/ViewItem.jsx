import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BACKEND_BASE_URL, ITEM_BY_ID } from "../../Utils/Constant";
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
        const response = await fetch(ITEM_BY_ID, {
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
    return <div className="panel">Loading item...</div>;
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
      <div className="detail-header">
        <div>
          <p className="eyebrow">Items</p>
          <h2>View Item</h2>
        </div>
        <button className="secondary-btn" onClick={() => navigate("/items")}>
          Back
        </button>
      </div>

      <div className="panel detail-panel simple-view-panel">
        <div className="form-grid">
          <div className="form-main-column">
            <KeyValueDisplay data={displayData} />
          </div>
          <aside className="form-side-column">
            <div className="field">
              <span>Category Image Preview</span>
              <div className="image-upload-box image-upload-box-compact">
                <img
                  src={`/images/${item.category_image}`}
                  alt={item.category_name || "Category"}
                  className="preview-image"
                  onError={(event) => {
                    event.currentTarget.src = `https://placehold.co/600x360?text=${encodeURIComponent(
                      item.category_name || "Category"
                    )}`;
                  }}
                />
              </div>
            </div>
            <div className="field">
              <span>Item Image Preview</span>
              <div className="image-upload-box image-upload-box-compact">
                <img
                  src={`${BACKEND_BASE_URL}/images/${item.item_image}`}
                  alt={item.item_name}
                  className="preview-image"
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
