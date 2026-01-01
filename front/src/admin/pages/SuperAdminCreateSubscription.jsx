import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import { Calendar, Plus, Save, X, Building2 } from "lucide-react";

export default function SuperAdminCreateSubscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    tenantId: "",
    planId: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    autoRenew: true,
    notes: ""
  });

  useEffect(() => {
    fetchTenants();

    // Check if tenantId is passed from tenant detail page
    if (location.state?.tenantId) {
      setFormData(prev => ({
        ...prev,
        tenantId: location.state.tenantId
      }));
    }
  }, [location.state]);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/superadmin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 } // Get more tenants for selection
      });

      if (response.data.success) {
        setTenants(response.data.data || []);
      }
    } catch (error) {
      handleApiError(error, "tenants");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");

      // Convert dates to proper ISO format
      const submissionData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      console.log("Submitting subscription with data:", submissionData);

      const response = await axios.post(
        "http://localhost:3000/api/superadmin/subscriptions",
        submissionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Subscription created successfully!");
        navigate("/superadmin/subscriptions");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error(error.response?.data?.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearForm = () => {
    setFormData({
      tenantId: "",
      planId: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      autoRenew: true,
      notes: ""
    });
    toast.success("Form cleared successfully!");
  };


  const [availablePlans, setAvailablePlans] = useState([]);

  useEffect(() => {
    fetchAvailablePlans();
  }, []);

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



  return (
    <div className="p-4 sm:p-6 ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Create New Subscription
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Set up a subscription plan for a tenant
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-8">
          {/* Tenant Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Tenant Selection
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Tenant * {location.state?.tenantId && "(Pre-selected from tenant page)"}
              </label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) => handleInputChange('tenantId', e.target.value)}
                disabled={!!location.state?.tenantId}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose a tenant...</option>
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Plan *
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Plans are managed in Plan Management)
                </span>
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

              {formData.planId && (() => {
                const selectedPlan = availablePlans.find(p => p.key === formData.planId);
                return selectedPlan ? (
                  <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Selected Plan Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Plan Name:</strong> {selectedPlan.name}</div>
                      <div><strong>Price:</strong> ${selectedPlan.price} {selectedPlan.currency}</div>
                      <div><strong>Billing Cycle:</strong> {selectedPlan.billingCycle}</div>
                      <div><strong>Limits:</strong></div>
                      <div className="ml-4 space-y-1">
                        <div>• Users: {selectedPlan.limits.users === -1 ? 'Unlimited' : selectedPlan.limits.users}</div>
                        <div>• Books: {selectedPlan.limits.books === -1 ? 'Unlimited' : selectedPlan.limits.books}</div>
                        <div>• Storage: {selectedPlan.limits.storage === -1 ? 'Unlimited' : `${(selectedPlan.limits.storage / (1024 * 1024 * 1024)).toFixed(1)} GB`}</div>
                        <div>• Bandwidth: {selectedPlan.limits.bandwidth === -1 ? 'Unlimited' : `${(selectedPlan.limits.bandwidth / (1024 * 1024 * 1024)).toFixed(1)} GB`}</div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
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
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/superadmin/subscriptions")}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-6 py-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Subscription
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
