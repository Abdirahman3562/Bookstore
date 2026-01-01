import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiUtils";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";

export default function SuperAdminTenants() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmColor: "bg-red-600 hover:bg-red-700"
  });

  const getTimeUntilExpiry = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;

    // If already expired
    if (diffTime <= 0) {
      const diffMinutes = Math.abs(Math.floor(diffTime / (1000 * 60)));
      if (diffMinutes < 60) {
        return {
          text: `Expired ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`,
          status: 'expired',
          isExpired: true
        };
      } else if (diffMinutes < 1440) { // Less than 24 hours
        const diffHours = Math.floor(diffMinutes / 60);
        return {
          text: `Expired ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`,
          status: 'expired',
          isExpired: true
        };
      } else {
        const diffDays = Math.floor(diffMinutes / 1440);
        return {
          text: `Expired ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`,
          status: 'expired',
          isExpired: true
        };
      }
    }

    // Calculate remaining time
    const totalMinutes = Math.floor(diffTime / (1000 * 60));

    if (totalMinutes < 60) {
      // Less than 1 hour - show minutes
      if (totalMinutes <= 5) {
        return {
          text: `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} left`,
          status: 'critical',
          isExpired: false
        };
      } else if (totalMinutes <= 30) {
        return {
          text: `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} left`,
          status: 'warning',
          isExpired: false
        };
      }
      return {
        text: `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} left`,
        status: 'normal',
        isExpired: false
      };
    } else if (totalMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours <= 2) {
        return {
          text: `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} left`,
          status: 'warning',
          isExpired: false
        };
      }
      return {
        text: `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} left`,
        status: 'normal',
        isExpired: false
      };
    } else {
      // More than 24 hours - show days
      const days = Math.floor(totalMinutes / 1440);
      if (days <= 7) {
        return {
          text: `${days} day${days !== 1 ? 's' : ''} left`,
          status: 'warning',
          isExpired: false
        };
      }
      return {
        text: `${days} day${days !== 1 ? 's' : ''} left`,
        status: 'normal',
        isExpired: false
      };
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter, searchTerm]);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await axios.get("http://localhost:3000/api/superadmin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setTenants(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      handleApiError(error, "tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (tenantId) => {
    setConfirmModal({
      isOpen: true,
      title: "Suspend Tenant",
      message: "Are you sure you want to suspend this tenant? The tenant will lose access to the platform.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");
          await axios.put(
            `http://localhost:3000/api/superadmin/tenants/${tenantId}/suspend`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success("Tenant suspended successfully");
          fetchTenants();
        } catch (error) {
          toast.error("Failed to suspend tenant");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      confirmColor: "bg-yellow-600 hover:bg-yellow-700"
    });
  };

  const handleActivate = async (tenantId) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(
        `http://localhost:3000/api/superadmin/tenants/${tenantId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Tenant activated successfully");
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to activate tenant");
    }
  };

  const handleDelete = (tenantId) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently Delete Tenant",
      message: "Are you sure you want to permanently delete this tenant from the database? This action CANNOT be undone and will completely remove the tenant, cancel all subscriptions, and delete all associated data.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");
          await axios.delete(
            `http://localhost:3000/api/superadmin/tenants/${tenantId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success("Tenant permanently deleted from database");
          fetchTenants();
        } catch (error) {
          toast.error("Failed to delete tenant");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      confirmColor: "bg-red-600 hover:bg-red-700"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Tenants
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all tenants on the platform
          </p>
        </div>
        <button
          onClick={() => navigate("/superadmin/tenants/new")}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {tenants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No tenants found</p>
            <button
              onClick={() => navigate("/superadmin/tenants/new")}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first tenant
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Subscription
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Stats
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tenants.map((tenant) => {
                    const expiryInfo = tenant.subscription ? getTimeUntilExpiry(tenant.subscription.endDate) : null;
                    return (
                      <tr
                        key={tenant._id}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          expiryInfo && expiryInfo.status === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                            : expiryInfo && expiryInfo.status === 'warning' && !expiryInfo.isExpired
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                            : expiryInfo && expiryInfo.isExpired
                            ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75'
                            : ''
                        }`}
                        onClick={() => navigate(`/superadmin/tenants/${tenant._id}`)}
                      >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tenant.name}
                          </p>
                          {tenant.subdomain && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {tenant.subdomain}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {tenant.contactEmail}
                        </p>
                        {tenant.contactName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tenant.contactName}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tenant.subscription ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {tenant.subscription.planName}
                            </p>
                            {(() => {
                              const expiryInfo = getTimeUntilExpiry(tenant.subscription.endDate);
                              return (
                                <p className={`text-xs font-medium ${
                                  expiryInfo.status === 'critical'
                                    ? 'text-red-700 dark:text-red-300 animate-pulse'
                                    : expiryInfo.status === 'warning'
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {expiryInfo.text}
                                </p>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tenant.stats && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <p>Users: {tenant.stats.users}</p>
                            <p>Books: {tenant.stats.books}</p>
                            <p>Admins: {tenant.stats.admins}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            tenant.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : tenant.status === "expired"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : tenant.status === "suspended"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/superadmin/tenants/${tenant._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Manage Admins"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/superadmin/tenants/${tenant._id}/edit`)}
                            className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {tenant.status === "active" ? (
                            <button
                              onClick={() => handleSuspend(tenant._id)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                              title="Suspend"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(tenant._id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              title="Activate"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(tenant._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmColor={confirmModal.confirmColor}
      />
    </div>
  );
}

