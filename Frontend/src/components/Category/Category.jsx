import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BACKEND_BASE_URL, CATEGORY_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../../components/common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import {
  setCategoryData,
  setCategorySelectedItem,
} from "../../Redux/CardSlice";

function Category() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(CATEGORY_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          limit,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch categories");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setCategoryData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setCategorySelectedItem(rowData));
    navigate(target(rowData.id));
  };

  const handlePageChange = (page, nextPageSize) => {
    setCurrentPage(page);
    setPageSize(nextPageSize);
  };

  const handleOpenActions = (event, rowData) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowData);
  };

  const handleCloseActions = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const headers = [
    { key: "id", label: "Id" },
    {
      key: "category_image",
      label: "Image",
      content: (item) => (
        <img
          className="table-thumb"
          src={`${BACKEND_BASE_URL}/images/${item.category_image}`}
          alt={item.category_name}
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/e2f6ef/205c49?text=${encodeURIComponent(
              item.category_name
            )}`;
          }}
        />
      ),
    },
    { key: "category_name", label: "Category Name" },
    {
      key: "category_description",
      label: "Description",
      content: (item) => (
        <span className="table-description-cell" title={item.category_description || "-"}>
          {item.category_description || "-"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      content: (item) => <StatusPill active={Number(item.is_active) === 1} />,
    },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      content: (rowData) => (
        <button
          type="button"
          className="row-menu-button"
          onClick={(event) => handleOpenActions(event, rowData)}
        >
          ...
        </button>
      ),
    },
  ];

  return (
    <div className="category-admin-page">
      <section className="content-band">
        <div className="content-band-top">
          <button className="primary-btn admin-add-btn" onClick={() => navigate("/addcategory")}>
            Add
          </button>
          <div className="admin-breadcrumb">
            <span>Home</span>
            <span>/</span>
            <strong>Category</strong>
          </div>
        </div>

        <Table
          data={data}
          headers={headers}
          loading={loading}
          searchPlaceholder="Search..."
          totalRowsLabel="Total Rows"
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalItems={totalCount}
        />
      </section>

      <ActionPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleClose={handleCloseActions}
        selectedRow={selectedRow}
        onEdit={() => handleRowAction(selectedRow, (value) => `/editcategory/${value}`)}
        onView={() => handleRowAction(selectedRow, (value) => `/viewcategory/${value}`)}
        onDelete={() => handleRowAction(selectedRow, (value) => `/deletecategory/${value}`)}
      />
    </div>
  );
}

export default Category;
