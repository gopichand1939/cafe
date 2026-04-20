import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CATEGORY_BY_ID, CATEGORY_DELETE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { getImageUrl } from "../../Utils/imageUrl";
import { setCategorySelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../../components/common/KeyValueDisplay";
import { Button, Card, PageSection } from "../ui";

function DeleteCategory() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedCategory = useSelector((state) => state.card.categorySelectedItem);
  const [category, setCategory] = useState(selectedCategory);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (
      Number(selectedCategory?.id) === Number(id) &&
      typeof selectedCategory?.category_image !== "undefined"
    ) {
      setCategory(selectedCategory);
      return;
    }

    const fetchCategory = async () => {
      try {
        const response = await fetchWithRefreshToken(CATEGORY_BY_ID, {
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
        dispatch(setCategorySelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch category");
        navigate("/category");
      }
    };

    fetchCategory();
  }, [dispatch, id, navigate, selectedCategory]);

  const handleDelete = async () => {
    if (!category?.id) {
      toast.error("No category selected");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetchWithRefreshToken(CATEGORY_DELETE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: category.id }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
      navigate("/category");
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!category) {
    return <Card>Loading category...</Card>;
  }

  const displayData = {
    id: category.id,
    category_name: category.category_name || "-",
    category_description: category.category_description || "-",
    category_image: category.category_image || "-",
    is_active: Number(category.is_active) === 1 ? "Active" : "Inactive",
    created_at: new Date(category.created_at).toLocaleString(),
    updated_at: new Date(category.updated_at).toLocaleString(),
  };

  return (
    <div className="ui-page">
      <PageSection
        eyebrow="Category"
        title="Delete Category"
        subtitle="Review the category details below before removing it from the live menu."
        actions={
          <Button variant="secondary" onClick={() => navigate("/category")}>
            Back
          </Button>
        }
      />

      <Card tone="danger" className="mt-0">
        <div className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} />
          </div>
          <aside className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="ui-label">Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[20px] border border-dashed border-border-subtle bg-surface-muted">
                <img
                  src={getImageUrl(category, "category_image")}
                  alt={category.category_name}
                  className="h-full min-h-[240px] max-h-[280px] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = `https://placehold.co/600x360?text=${encodeURIComponent(
                      category.category_name
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
        <Button variant="secondary" onClick={() => navigate("/category")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default DeleteCategory;
