import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ITEM_BY_ID, ITEM_DELETE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { getImageUrl } from "../../Utils/imageUrl";
import { setItemSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../../components/common/KeyValueDisplay";
import { Button, Card, PageSection } from "../ui";

function DeleteItem() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedItem = useSelector((state) => state.card.itemSelectedItem);
  const [item, setItem] = useState(selectedItem);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (
      Number(selectedItem?.id) === Number(id) &&
      typeof selectedItem?.item_image !== "undefined" &&
      typeof selectedItem?.category_image !== "undefined"
    ) {
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

  const handleDelete = async () => {
    if (!item?.id) {
      toast.error("No item selected");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetchWithRefreshToken(ITEM_DELETE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: item.id }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete item");
      }

      toast.success("Item deleted successfully");
      navigate("/items");
    } catch (error) {
      toast.error(error.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!item) {
    return <Card>Loading item...</Card>;
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
    <div className="ui-page">
      <PageSection
        eyebrow="Items"
        title="Delete Item"
        subtitle="Review the item and related preview images before permanently removing it."
        actions={<Button variant="secondary" onClick={() => navigate("/items")}>Back</Button>}
      />

      <Card tone="danger" className="mt-0">
        <div className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} />
          </div>
          <aside className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="ui-label">Category Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[20px] border border-dashed border-border-subtle bg-surface-muted">
                <img
                  src={getImageUrl(item, "category_image")}
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
              <span className="ui-label">Item Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[20px] border border-dashed border-border-subtle bg-surface-muted">
                <img
                  src={getImageUrl(item, "item_image")}
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
      </Card>

      <div className="mt-0.5 flex flex-wrap gap-2.5">
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/items")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default DeleteItem;
