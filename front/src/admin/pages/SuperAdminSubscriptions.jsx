import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Building2,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";

export default function SuperAdminSubscriptions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
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

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter, searchTerm]);

  const fetchSubscriptions = async () => {
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

      const response = await axios.get("http://localhost:3000/api/superadmin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setSubscriptions(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (subscriptionId) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Subscription",
      message: "Are you sure you want to cancel this subscription? The tenant will lose access to paid features immediately.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");
          console.log(`Cancelling subscription with ID: ${subscriptionId}`);

          const response = await axios.put(
            `http://localhost:3000/api/superadmin/subscriptions/${subscriptionId}/cancel`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log("Cancel subscription response:", response.data);
          toast.success("Subscription cancelled successfully!");
          fetchSubscriptions();

          // Close modal after a short delay to ensure toast is visible
          setTimeout(() => {
            setConfirmModal({ ...confirmModal, isOpen: false });
          }, 500);
          return; // Exit early to avoid the modal close below
        } catch (error) {
          console.error("Cancel subscription error:", error);
          console.error("Error response:", error.response?.data);
          console.error("Error status:", error.response?.status);

          // Check if the operation actually succeeded despite the error
          if (error.response?.data?.success === true ||
              error.response?.data?.message?.includes("cancelled successfully") ||
              error.response?.status === 200) {
            console.log("Operation actually succeeded, showing success toast");
            toast.success("Subscription cancelled successfully!");
            fetchSubscriptions();

            // Close modal after a short delay
            setTimeout(() => {
              setConfirmModal({ ...confirmModal, isOpen: false });
            }, 500);
            return;
          }

          let errorMessage = "Failed to cancel subscription";

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 404) {
            errorMessage = "Subscription not found";
          } else if (error.response?.status === 400) {
            errorMessage = "Invalid request or subscription already cancelled";
          } else if (error.response?.status === 401) {
            errorMessage = "Unauthorized - please login again";
          } else if (error.response?.status === 500) {
            errorMessage = "Server error - please try again later";
          }

          toast.error(errorMessage);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      confirmColor: "bg-red-600 hover:bg-red-700"
    });
  };

  const handleRenew = (subscriptionId) => {
    setConfirmModal({
      isOpen: true,
      title: "Renew Subscription",
      message: "Are you sure you want to renew this subscription? This will extend the subscription period and charge the tenant.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");
          console.log(`Renewing subscription with ID: ${subscriptionId}`);

          const response = await axios.put(
            `http://localhost:3000/api/superadmin/subscriptions/${subscriptionId}/renew`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log("Renew subscription response:", response.data);
          toast.success("Subscription renewed successfully!");
          fetchSubscriptions();

          // Close modal after a short delay to ensure toast is visible
          setTimeout(() => {
            setConfirmModal({ ...confirmModal, isOpen: false });
          }, 500);
          return; // Exit early to avoid the modal close below
        } catch (error) {
          console.error("Renew subscription error:", error);
          console.error("Error response:", error.response?.data);
          console.error("Error status:", error.response?.status);

          let errorMessage = "Failed to renew subscription";

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 404) {
            errorMessage = "Subscription not found";
          } else if (error.response?.status === 400) {
            errorMessage = "Invalid request or subscription cannot be renewed";
          } else if (error.response?.status === 401) {
            errorMessage = "Unauthorized - please login again";
          } else if (error.response?.status === 500) {
            errorMessage = "Server error - please try again later";
          }

          toast.error(errorMessage);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      confirmColor: "bg-green-600 hover:bg-green-700"
    });
  };

  const handleReactivate = (subscriptionId) => {
    setConfirmModal({
      isOpen: true,
      title: "Reactivate Subscription",
      message: "Are you sure you want to reactivate this subscription? The tenant will regain access to paid features.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");

          // First get the subscription to know the tenant
          const subResponse = await axios.get(
            `http://localhost:3000/api/superadmin/subscriptions/${subscriptionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (subResponse.data.success) {
            const subscription = subResponse.data.data;

            // Update subscription status to active
            await axios.put(
              `http://localhost:3000/api/superadmin/subscriptions/${subscriptionId}`,
              { status: "active" },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // Activate the tenant as well
            if (subscription.tenantId) {
              try {
                await axios.put(
                  `http://localhost:3000/api/superadmin/tenants/${subscription.tenantId._id || subscription.tenantId}/activate`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (tenantError) {
                console.error("Error activating tenant:", tenantError);
                // Don't fail the operation
              }
            }

            toast.success("Subscription reactivated successfully!");
            fetchSubscriptions();
          }
        } catch (error) {
          toast.error("Failed to reactivate subscription");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      confirmColor: "bg-green-600 hover:bg-green-700"
    });
  };

  const handleCreate = () => {
    navigate("/superadmin/subscriptions/create");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 inline mr-1" />
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            <XCircle className="w-3 h-3 inline mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 inline mr-1" />
            Pending
          </span>
        );
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tenant subscriptions and expiry notifications
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
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
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No subscriptions found</p>
            <button
              onClick={handleCreate}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first subscription
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
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Expiry
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subscriptions.map((subscription) => {
                    const expiryInfo = getTimeUntilExpiry(subscription.endDate);
                    return (
                      <tr
                        key={subscription._id}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          expiryInfo.status === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                            : expiryInfo.status === 'warning' && !expiryInfo.isExpired
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                            : expiryInfo.isExpired
                            ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75'
                            : ''
                        }`}
                        onClick={() => navigate(`/superadmin/subscriptions/${subscription._id}`)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {subscription.tenantId?.name || "Unknown Tenant"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {subscription.tenantId?.contactEmail || ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {subscription.planName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {subscription.billingCycle}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {subscription.price?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {subscription.currency}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(subscription.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(subscription.endDate).toLocaleDateString()}
                            </p>
                            {subscription.status === 'active' && (
                              <p className={`text-xs font-medium ${
                                expiryInfo.status === 'expired'
                                  ? 'text-red-600 dark:text-red-400'
                                  : expiryInfo.status === 'critical'
                                  ? 'text-red-700 dark:text-red-300 animate-pulse'
                                  : expiryInfo.status === 'warning'
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {expiryInfo.text}
                              </p>
                            )}
                            {subscription.status === 'expired' && (
                              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                {expiryInfo.text}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/superadmin/subscriptions/${subscription._id}/edit`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="Edit Subscription"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {subscription.status === 'expired' && (
                              <button
                                onClick={() => handleRenew(subscription._id)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Renew Subscription"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {subscription.status === 'active' && (
                              <button
                                onClick={() => handleCancel(subscription._id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Cancel Subscription"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {subscription.status === 'cancelled' && (
                              <button
                                onClick={() => handleReactivate(subscription._id)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Reactivate Subscription"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
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
