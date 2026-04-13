import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BACKEND_BASE_URL, ITEM_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../../components/common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import { setItemData, setItemSelectedItem } from "../../Redux/CardSlice";

function Item() {
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
      const response = await fetchWithRefreshToken(ITEM_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, limit }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch items");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setItemData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setItemSelectedItem(rowData));
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
    { key: "category_name", label: "Category Name" },
    {
      key: "category_image",
      label: "Category Image",
      content: (item) => (
        <img
          className="table-thumb"
          src={`${BACKEND_BASE_URL}/images/${item.category_image}`}
          alt={item.category_name}
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/e2f6ef/205c49?text=${encodeURIComponent(
              item.category_name || "Category"
            )}`;
          }}
        />
      ),
    },
    { key: "item_name", label: "Item Name" },
    {
      key: "item_image",
      label: "Item Image",
      content: (item) => (
        <img
          className="table-thumb"
          src={`${BACKEND_BASE_URL}/images/${item.item_image}`}
          alt={item.item_name}
          onError={(event) => {
            event.currentTarget.src = `https://placehold.co/120x90/e2f6ef/205c49?text=${encodeURIComponent(
              item.item_name
            )}`;
          }}
        />
      ),
    },
    {
      key: "item_description",
      label: "Description",
      content: (item) => (
        <span className="table-description-cell" title={item.item_description || "-"}>
          {item.item_description || "-"}
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
          <button className="primary-btn admin-add-btn" onClick={() => navigate("/additem")}>
            Add
          </button>
          <div className="admin-breadcrumb">
            <span>Home</span>
            <span>/</span>
            <strong>Items</strong>
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
        onEdit={() => handleRowAction(selectedRow, (value) => `/edititem/${value}`)}
        onView={() => handleRowAction(selectedRow, (value) => `/viewitem/${value}`)}
        onDelete={() => handleRowAction(selectedRow, (value) => `/deleteitem/${value}`)}
      />
    </div>
  );
}

export default Item;
