import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import {
  Building2,
  Calendar,
  Users,
  BookOpen,
  ShoppingCart,
  Mail,
  Phone,
  Globe,
  Edit,
  Trash2,
  UserPlus,
  CreditCard,
  AlertCircle
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

export default function SuperAdminTenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState({});
  const [admins, setAdmins] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmColor: "bg-red-600 hover:bg-red-700"
  });

  useEffect(() => {
    fetchTenantData();
  }, [id]);

  const fetchTenantData = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      // Fetch tenant details
      const tenantResponse = await axios.get(`http://localhost:3000/api/superadmin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (tenantResponse.data.success) {
        setTenant(tenantResponse.data.data);
        setSubscription(tenantResponse.data.data.subscription || null);
        setStats(tenantResponse.data.data.stats || {});
      }

      // Fetch tenant admins
      const adminsResponse = await axios.get(`http://localhost:3000/api/superadmin/tenants/${id}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (adminsResponse.data.success) {
        setAdmins(adminsResponse.data.data || []);
      }
    } catch (error) {
      handleApiError(error, "tenant details");
      navigate("/superadmin/tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Tenant",
      message: "Are you sure you want to delete this tenant? This action cannot be undone and will remove all associated data, subscriptions, and users.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");
          await axios.delete(`http://localhost:3000/api/superadmin/tenants/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          toast.success("Tenant deleted successfully!");
          navigate("/superadmin/tenants");
        } catch (error) {
          console.error("Error deleting tenant:", error);
          toast.error(error.response?.data?.message || "Failed to delete tenant");
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      confirmColor: "bg-red-600 hover:bg-red-700"
    });
  };

  const handleCreateAdmin = () => {
    navigate(`/superadmin/tenants/${id}/create-admin`);
  };

  const handleCreateSubscription = () => {
    navigate("/superadmin/subscriptions/create", { state: { tenantId: id } });
  };

  const handleCancelSubscription = (subscriptionId) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Subscription",
      message: "Are you sure you want to cancel this subscription? The tenant will lose access to paid features immediately.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("admin_token");
          console.log(`Cancelling subscription with ID: ${subscriptionId} from tenant detail`);

          const response = await axios.put(
            `http://localhost:3000/api/superadmin/subscriptions/${subscriptionId}/cancel`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log("Cancel subscription response:", response.data);
          toast.success("Subscription cancelled successfully!");
          fetchTenantData(); // Refresh tenant data

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
            fetchTenantData();

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


  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Expired</span>;
      case 'suspended':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Suspended</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{status}</span>;
    }
  };

  const getDaysUntilExpiry = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), status: 'expired' };
    } else if (diffDays <= 7) {
      return { days: diffDays, status: 'warning' };
    }
    return { days: diffDays, status: 'normal' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tenant not found</h2>
          <button
            onClick={() => navigate("/superadmin/tenants")}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {tenant.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1">
                Tenant Details & Management
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/superadmin/tenants/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Tenant
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Tenant
            </button>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tenant Status</p>
              <div className="mt-2">
                {getStatusBadge(tenant.status)}
              </div>
            </div>
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Subscription Status</p>
              <div className="mt-2">
                {subscription ? getStatusBadge(subscription.status) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    No Subscription
                  </span>
                )}
              </div>
            </div>
            <CreditCard className="w-8 h-8 text-green-600 dark:text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Domain</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {tenant.subdomain ? `${tenant.subdomain}.bookstore.com` : tenant.domain || 'No domain'}
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-600 dark:text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tenant Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Tenant Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tenant Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contact Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{tenant.contactEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contact Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{tenant.contactName || 'Not specified'}</p>
              </div>
            </div>

            {tenant.contactPhone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contact Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{tenant.contactPhone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Subscription
            </h2>
            {!subscription && (
            <button
              onClick={handleCreateSubscription}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
            >
              Create Subscription
            </button>
            )}
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                <p className="font-medium text-gray-900 dark:text-white">{subscription.planName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <div className="mt-1">{getStatusBadge(subscription.status)}</div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${subscription.price} / {subscription.billingCycle}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                  {subscription.status === 'active' && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getDaysUntilExpiry(subscription.endDate).status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : getDaysUntilExpiry(subscription.endDate).status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getDaysUntilExpiry(subscription.endDate).status === 'expired'
                        ? `${getDaysUntilExpiry(subscription.endDate).days} days overdue`
                        : `${getDaysUntilExpiry(subscription.endDate).days} days left`
                      }
                    </span>
                  )}
                </div>
              </div>

              {/* Subscription Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/superadmin/subscriptions`)}
                    className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Manage Subscription
                  </button>
                  {subscription.status === 'active' && (
                    <button
                      onClick={() => handleCancelSubscription(subscription._id)}
                      className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No active subscription</p>
              <button
                onClick={handleCreateSubscription}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create Subscription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.users || 0}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-600 dark:text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Books</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.books || 0}
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Admins</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.admins || 0}
              </p>
            </div>
            <UserPlus className="w-12 h-12 text-green-600 dark:text-green-500" />
          </div>
        </div>
      </div>

      {/* Tenant Admins */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tenant Administrators
          </h2>
            <button
              onClick={handleCreateAdmin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
        </div>

        {admins.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No administrators assigned</p>
              <button
                onClick={handleCreateAdmin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Create First Admin
              </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admins.map((admin) => (
              <div key={admin._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {admin.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{admin.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    admin.adminRole === 'SUPER_ADMIN'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : admin.adminRole === 'admin'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {admin.adminRole}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
