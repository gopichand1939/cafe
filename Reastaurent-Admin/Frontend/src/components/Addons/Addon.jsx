import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ADDON_GROUP_CREATE,
  ADDON_GROUP_DELETE,
  ADDON_GROUP_LIST,
  ADDON_GROUP_UPDATE,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../../components/common/StatusPill";
import Table from "../Table";
import { Button, Card, PageSection } from "../ui";
import AddonForm from "./AddonForm";

function Addon() {
  const [data, setData] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async (page = currentPage, limit = pageSize) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(ADDON_GROUP_LIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, limit }),
      });
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch addon groups");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
    } catch (error) {
      toast.error(error.message || "Failed to fetch addon groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(
        payload.id ? ADDON_GROUP_UPDATE : ADDON_GROUP_CREATE,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to save addon group");
      }

      toast.success(payload.id ? "Addon group updated successfully" : "Addon group created successfully");
      setSelectedGroup(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to save addon group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete addon group "${row.group_name}"?`)) {
      return;
    }

    try {
      const response = await fetchWithRefreshToken(ADDON_GROUP_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to delete addon group");
      }

      toast.success("Addon group deleted successfully");
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to delete addon group");
    }
  };

  const headers = [
    { key: "id", label: "Id", width: "60px" },
    { key: "group_name", label: "Group Name", width: "220px" },
    {
      key: "description",
      label: "Description",
      width: "260px",
      content: (item) => item.description || "-",
    },
    {
      key: "is_active",
      label: "Status",
      width: "90px",
      content: (item) => <StatusPill active={Number(item.is_active) === 1} />,
    },
    {
      key: "actions",
      label: "Actions",
      width: "170px",
      content: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setSelectedGroup(row)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="px-6 pt-3 pb-1">
        <PageSection eyebrow="Addons" title="Addon Group Master" />
      </div>

      <Card>
        <AddonForm
          selectedGroup={selectedGroup}
          onSubmit={handleSubmit}
          onCancel={() => setSelectedGroup(null)}
          isSubmitting={isSubmitting}
        />
      </Card>

      <Table
        data={data}
        headers={headers}
        loading={loading}
        searchPlaceholder="Search addon groups..."
        totalRowsLabel="Total Groups"
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={(page, nextPageSize) => {
          setCurrentPage(page);
          setPageSize(nextPageSize);
        }}
        totalItems={totalCount}
      />
    </div>
  );
}

export default Addon;
