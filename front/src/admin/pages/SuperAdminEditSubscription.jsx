import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import { Calendar, Save, X, Building2, RefreshCw } from "lucide-react";

export default function SuperAdminEditSubscription() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [formData, setFormData] = useState({
    tenantId: "",
    planId: "",
    planName: "",
    price: 0,
    billingCycle: "monthly",
    startDate: "",
    endDate: "",
    autoRenew: true,
    notes: "",
    status: "active",
    limits: {
      users: -1,
      books: -1,
      storage: -1,
      bandwidth: -1
    }
  });

  useEffect(() => {
    fetchSubscription();
    fetchTenants();
    fetchAvailablePlans();
  }, [id]);

  // Update form data when subscription is loaded
  useEffect(() => {
    if (subscription) {
        console.log("Loading subscription data:", {
          planId: subscription.planId,
          planName: subscription.planName,
          price: subscription.price,
          billingCycle: subscription.billingCycle,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          startDateFormatted: subscription.startDate ? new Date(subscription.startDate).toISOString().slice(0, 16) : "",
          endDateFormatted: subscription.endDate ? new Date(subscription.endDate).toISOString().slice(0, 16) : "",
          fullSubscription: subscription
        });

        // If subscription doesn't have planName but has planId, we might need to populate it
        let planName = subscription.planName || "";
        let price = subscription.price || 0;
        let billingCycle = subscription.billingCycle || "monthly";

        // If planName is missing but we have planId, try to get it from populated plan data
        if (!planName && subscription.planId && typeof subscription.planId === 'object') {
          planName = subscription.planId.name || "";
          price = subscription.planId.price || price;
          billingCycle = subscription.planId.billingCycle || billingCycle;
        }

        // Normalize planId to use the key for consistency with select options
        let normalizedPlanId = "";
        if (subscription.planId) {
          if (typeof subscription.planId === 'object' && subscription.planId.key) {
            normalizedPlanId = subscription.planId.key;
          } else if (typeof subscription.planId === 'string') {
            // If it's a string, it might be the key or _id. Try to find the matching plan.
            const matchingPlan = availablePlans.find(p => p._id === subscription.planId || p.key === subscription.planId);
            normalizedPlanId = matchingPlan ? matchingPlan.key : subscription.planId;
          }
        }

        const formDataToSet = {
          tenantId: subscription.tenantId?._id || subscription.tenantId || "",
          planId: normalizedPlanId,
          planName: planName,
          price: price,
          billingCycle: billingCycle,
          startDate: subscription.startDate ? formatDateForInput(subscription.startDate) : "",
          endDate: subscription.endDate ? formatDateForInput(subscription.endDate) : "",
          autoRenew: subscription.autoRenew !== undefined ? subscription.autoRenew : true,
          notes: subscription.notes || "",
          status: subscription.status || "active",
          limits: subscription.limits || {
            users: -1,
            books: -1,
            storage: -1,
            bandwidth: -1
          }
        };

        console.log("Setting formData:", {
          ...formDataToSet,
          startDateFormatted: formDataToSet.startDate,
          endDateFormatted: formDataToSet.endDate
        });
        setFormData(formDataToSet);
    }
  }, [subscription]);

  // Debug: Log when form data is loaded
  useEffect(() => {
    if (subscription) {
      console.log("Subscription loaded with data:", {
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        price: subscription.price,
        billingCycle: subscription.billingCycle
      });
    }
  }, [subscription]);

  // Ensure plan details are populated after availablePlans are loaded
  useEffect(() => {
    if (subscription && availablePlans.length > 0 && formData.planId) {
      const selectedPlan = availablePlans.find(p => p.key === formData.planId);
      console.log("Checking plan details population:", {
        planId: formData.planId,
        selectedPlan: selectedPlan,
        currentPlanName: formData.planName,
        subscriptionPlanName: subscription.planName
      });

      // If planName is missing from formData but we have a selected plan, populate it
      if (selectedPlan && (!formData.planName || formData.planName === "")) {
        console.log("Populating missing planName from available plans:", selectedPlan.name);
        setFormData(prev => ({
          ...prev,
          planName: selectedPlan.name || prev.planName,
          price: selectedPlan.price !== undefined ? selectedPlan.price : prev.price,
          billingCycle: selectedPlan.billingCycle || prev.billingCycle
        }));
      }
    }
  }, [subscription, availablePlans, formData.planId]);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      console.log(`Fetching subscription with ID: ${id}`);
      const response = await axios.get(`http://localhost:3000/api/superadmin/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Subscription API response:", response.data);

      if (response.data.success) {
        console.log("Setting subscription data:", response.data.data);
        setSubscription(response.data.data);
      }
    } catch (error) {
      handleApiError(error, "subscription");
      navigate("/superadmin/subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/superadmin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });

      if (response.data.success) {
        setTenants(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/superadmin/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const plans = response.data.data || {};
        // Convert plans object to array with key included
        const plansArray = Object.entries(plans).map(([key, plan]) => ({
          key,
          ...plan
        }));
        setAvailablePlans(plansArray);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("admin_token");

      // Update subscription
      const response = await axios.put(
        `http://localhost:3000/api/superadmin/subscriptions/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Synchronize tenant status based on subscription status
        const newStatus = formData.status;
        let tenantStatusUpdate = null;

        if (newStatus === 'active') {
          tenantStatusUpdate = 'active';
        } else if (newStatus === 'cancelled' || newStatus === 'expired') {
          // Check if tenant has any other active subscriptions before suspending
          try {
            const tenantSubsResponse = await axios.get(
              `http://localhost:3000/api/superadmin/subscriptions?tenantId=${formData.tenantId}&status=active`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // If no other active subscriptions, suspend the tenant
            if (!tenantSubsResponse.data.success || tenantSubsResponse.data.data.length === 0) {
              tenantStatusUpdate = 'suspended';
            }
          } catch (error) {
            console.error("Error checking tenant subscriptions:", error);
          }
        }

        // Update tenant status if needed
        if (tenantStatusUpdate && subscription.tenantId) {
          try {
            const tenantId = subscription.tenantId._id || subscription.tenantId;
            if (tenantStatusUpdate === 'active') {
              await axios.put(
                `http://localhost:3000/api/superadmin/tenants/${tenantId}/activate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } else if (tenantStatusUpdate === 'suspended') {
              await axios.put(
                `http://localhost:3000/api/superadmin/tenants/${tenantId}/suspend`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } catch (error) {
            console.error("Error updating tenant status:", error);
            // Don't fail the whole operation for this
          }
        }

        toast.success("Subscription updated successfully!");
        navigate("/superadmin/subscriptions");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error(error.response?.data?.message || "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const response = await axios.put(
        `http://localhost:3000/api/superadmin/subscriptions/${id}/renew`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Subscription renewed successfully!");
        // Refresh the subscription data
        fetchSubscription();
        fetchTenants();
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast.error(error.response?.data?.message || "Failed to renew subscription");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // If planId changed, automatically update plan name, price, and billing cycle
      if (field === 'planId' && value) {
        const selectedPlan = availablePlans.find(p => p.key === value);
        if (selectedPlan) {
          console.log("Auto-updating plan details:", selectedPlan);
          newData.planName = selectedPlan.name || '';
          newData.price = selectedPlan.price || 0;
          newData.billingCycle = selectedPlan.billingCycle || 'monthly';
        }
      }

      return newData;
    });
  };

  const handleLimitChange = (limitField, value) => {
    setFormData(prev => ({
      ...prev,
      limits: {
        ...prev.limits,
        [limitField]: value === "" ? -1 : parseInt(value) || -1
      }
    }));
  };



  const formatDateForInput = (dateValue) => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.error("Invalid date value:", dateValue);
        return "";
      }

      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log("Formatted date:", dateValue, "->", formatted);
      return formatted;
    } catch (error) {
      console.error("Error formatting date:", dateValue, error);
      return "";
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === -1) return "Unlimited";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log("Rendering edit form with formData:", formData);

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Edit Subscription
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Modify subscription details and settings
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-8">
          {/* Tenant Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Tenant Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant *
              </label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) => handleInputChange('tenantId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a tenant...</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} - {tenant.contactEmail}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Configuration */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Plan Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan Template *
                </label>
                <select
                  required
                  value={formData.planId}
                  onChange={(e) => handleInputChange('planId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose a plan...</option>
                    {availablePlans.map((plan, index) => (
                      <option key={`plan-${plan.key || index}`} value={plan.key}>
                        {plan.name} - ${plan.price}/{plan.billingCycle} ({plan.currency})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan Template *
                </label>
                <input
                  type="text"
                  required
                  value={formData.planName}
                  onChange={(e) => handleInputChange('planName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                  placeholder="Enter plan template name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Billing Cycle *
                </label>
                <select
                  required
                  value={formData.billingCycle}
                  onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select billing cycle...</option>
                  {[...new Set(availablePlans.map(plan => plan.billingCycle))].map(cycle => (
                    <option key={cycle} value={cycle}>
                      {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.autoRenew}
                  onChange={(e) => handleInputChange('autoRenew', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-renew subscription when it expires
                </span>
              </label>
            </div>
          </div>

          {/* Plan Limits */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Plan Limits
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Users (-1 = unlimited)
                </label>
                <input
                  type="number"
                  value={formData.limits.users === -1 ? "" : formData.limits.users}
                  onChange={(e) => handleLimitChange('users', e.target.value)}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Books (-1 = unlimited)
                </label>
                <input
                  type="number"
                  value={formData.limits.books === -1 ? "" : formData.limits.books}
                  onChange={(e) => handleLimitChange('books', e.target.value)}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Limit (GB)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.limits.storage === -1 ? "" : (formData.limits.storage / (1024 * 1024 * 1024)).toFixed(1)}
                  onChange={(e) => handleLimitChange('storage', e.target.value ? parseFloat(e.target.value) * 1024 * 1024 * 1024 : -1)}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {formatBytes(formData.limits.storage)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bandwidth Limit (GB)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.limits.bandwidth === -1 ? "" : (formData.limits.bandwidth / (1024 * 1024 * 1024)).toFixed(1)}
                  onChange={(e) => handleLimitChange('bandwidth', e.target.value ? parseFloat(e.target.value) * 1024 * 1024 * 1024 : -1)}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {formatBytes(formData.limits.bandwidth)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
              placeholder="Any additional notes about this subscription..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              {subscription?.status === 'expired' && (
                <button
                  type="button"
                  onClick={handleRenew}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Renew Subscription
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/superadmin/subscriptions")}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
