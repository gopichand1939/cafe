import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CATEGORY_BY_ID, CATEGORY_DELETE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { getImageUrl } from "../../Utils/imageUrl";
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
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading category...</div>;
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Category</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">Delete Category</h2>
        </div>
        <button className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/category")}>
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
              <span className="text-[0.92rem] font-semibold text-slate-600">Image Preview</span>
              <div className="grid min-h-[240px] max-h-[280px] place-items-center overflow-hidden rounded-[8px] border border-dashed border-slate-300 bg-[#fffaf5]">
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
      </div>

      <div className="mt-0.5 flex flex-wrap gap-2.5">
        <button className="rounded-[8px] border-0 bg-red-600 px-4 py-[11px] font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button className="rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/category")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DeleteCategory;
