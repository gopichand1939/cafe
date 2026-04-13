import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CATEGORY_BY_ID, CATEGORY_DELETE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setCategorySelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../../components/common/KeyValueDisplay";

function DeleteCategory() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedCategory = useSelector((state) => state.card.categorySelectedItem);
  const [category, setCategory] = useState(selectedCategory);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (Number(selectedCategory?.id) === Number(id)) {
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
    return <div className="panel">Loading category...</div>;
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
    <div>
      <div className="detail-header">
        <div>
          <p className="eyebrow">Category</p>
          <h2>Delete Category</h2>
        </div>
        <button className="secondary-btn" onClick={() => navigate("/category")}>
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
              <span>Image Preview</span>
              <div className="image-upload-box image-upload-box-compact">
                <img
                  src={`/images/${category.category_image}`}
                  alt={category.category_name}
                  className="preview-image"
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
      </div>

      <div className="button-row form-actions-row">
        <button className="danger-btn" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button className="secondary-btn" onClick={() => navigate("/category")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DeleteCategory;
