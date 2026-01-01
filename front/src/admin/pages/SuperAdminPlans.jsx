import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import {
  Settings,
  DollarSign,
  Users,
  BookOpen,
  HardDrive,
  Wifi,
  Edit,
  Save,
  X,
  Calendar,
  TrendingUp,
  Crown,
  Plus,
  Trash2,
} from "lucide-react";

export default function SuperAdminPlans() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState({});
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    key: "",
    name: "",
    price: 0,
    currency: "USD",
    billingCycle: "monthly",
    limits: { users: -1, books: -1, storage: -1, bandwidth: -1 },
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    planKey: null,
  });

  const defaultPlans = {
    free: {
      name: "Free Plan",
      price: 0,
      currency: "USD",
      billingCycle: "monthly",
      limits: {
        users: 5,
        books: 10,
        storage: 1073741824,
        bandwidth: 1073741824,
      },
    },
    monthly: {
      name: "Monthly Plan",
      price: 9.99,
      currency: "USD",
      billingCycle: "monthly",
      limits: { users: -1, books: -1, storage: -1, bandwidth: -1 },
    },
    yearly: {
      name: "Yearly Plan",
      price: 99.99,
      currency: "USD",
      billingCycle: "yearly",
      limits: { users: -1, books: -1, storage: -1, bandwidth: -1 },
    },
    lifetime: {
      name: "Lifetime Plan",
      price: 299.99,
      currency: "USD",
      billingCycle: "lifetime",
      limits: { users: -1, books: -1, storage: -1, bandwidth: -1 },
    },
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/superadmin/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apiPlans = response.data.data || {};

        // If no plans in database, show empty state
        if (Object.keys(apiPlans).length === 0) {
          setPlans({});
          console.log("No plans found in database.");
          return;
        }

        setPlans(apiPlans);
        console.log("Loaded plans from database:", apiPlans);
      } else {
        toast.error("Failed to load plans from database");
        setPlans({});
      }
    } catch (error) {
      handleApiError(error, "plans");
      setPlans({});
    } finally {
      setLoading(false);
    }
  };


  const handleAddPlan = async () => {
    if (!newPlanForm.key || !newPlanForm.name) {
      toast.error("Plan key and name are required");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.post(
        "http://localhost:3000/api/superadmin/plans",
        newPlanForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh plans from API
        await fetchPlans();

        setShowAddModal(false);
        setNewPlanForm({
          key: "",
          name: "",
          price: 0,
          currency: "USD",
          billingCycle: "monthly",
          limits: { users: -1, books: -1, storage: -1, bandwidth: -1 },
        });
        toast.success("Plan added successfully!");
      }
    } catch (error) {
      console.error("Error adding plan:", error);
      toast.error(error.response?.data?.message || "Failed to add plan");
    }
  };

  const handleDeletePlan = (planKey) => {
    setDeleteConfirm({ show: true, planKey });
  };

  const confirmDeletePlan = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`http://localhost:3000/api/superadmin/plans/${deleteConfirm.planKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh plans from API
      await fetchPlans();
      setDeleteConfirm({ show: false, planKey: null });
      toast.success("Plan deleted successfully!");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error(error.response?.data?.message || "Failed to delete plan");
    }
  };

  const handleEditPlan = (planKey) => {
    setEditingPlan(planKey);
    setEditForm({
      name: plans[planKey].name,
      price: plans[planKey].price,
      currency: plans[planKey].currency,
      billingCycle: plans[planKey].billingCycle,
      limits: { ...plans[planKey].limits },
    });
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditForm({});
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.put(
        `http://localhost:3000/api/superadmin/plans/${editingPlan}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update plans in state
        const updatedPlans = {
          ...plans,
          [editingPlan]: editForm,
        };
        setPlans(updatedPlans);

        setEditingPlan(null);
        setEditForm({});
        toast.success("Plan updated successfully!");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error(error.response?.data?.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith("limits.")) {
      const limitField = field.split(".")[1];
      setEditForm((prev) => ({
        ...prev,
        limits: {
          ...prev.limits,
          [limitField]: value === "" ? -1 : parseInt(value) || -1,
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [field]: field === "price" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === -1) return "Unlimited";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
  };

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case "free":
        return <Settings className="w-6 h-6 text-gray-500" />;
      case "monthly":
        return <Calendar className="w-6 h-6 text-blue-500" />;
      case "yearly":
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case "lifetime":
        return <Crown className="w-6 h-6 text-yellow-500" />;
      default:
        return <Settings className="w-6 h-6 text-gray-500" />;
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
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Plan Management
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Manage subscription plans, pricing, and limits
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {Object.keys(plans).length === 0 && !loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md mx-auto">
            {/* Animated Icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Settings className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md animate-bounce">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-md animate-pulse">
                <DollarSign className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                No Plans Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                No subscription plans have been created yet.
                Add your first plan to define pricing, limits, and billing cycles.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Pricing</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Limits</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Billing</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add New Plan
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </button>

            {/* Subtle hint */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              Plans will be loaded from the database
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(plans).map(([planKey, plan]) => (
          <div
            key={planKey}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPlanIcon(planKey)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {planKey} plan
                  </p>
                </div>
              </div>
              {editingPlan !== planKey && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditPlan(planKey)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Edit Plan"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(planKey)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {editingPlan === planKey ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency
                    </label>
                    <select
                      value={editForm.currency}
                      onChange={(e) =>
                        handleInputChange("currency", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Billing Cycle
                    </label>
                <select
                  value={editForm.billingCycle}
                  onChange={(e) =>
                    handleInputChange("billingCycle", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                </select>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Max Users (-1 = unlimited)
                      </label>
                      <input
                        type="number"
                        value={
                          editForm.limits.users === -1
                            ? ""
                            : editForm.limits.users
                        }
                        onChange={(e) =>
                          handleInputChange("limits.users", e.target.value)
                        }
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Max Books (-1 = unlimited)
                      </label>
                      <input
                        type="number"
                        value={
                          editForm.limits.books === -1
                            ? ""
                            : editForm.limits.books
                        }
                        onChange={(e) =>
                          handleInputChange("limits.books", e.target.value)
                        }
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Storage (GB)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={
                          editForm.limits.storage === -1
                            ? ""
                            : (
                                editForm.limits.storage /
                                (1024 * 1024 * 1024)
                              ).toFixed(1)
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "limits.storage",
                            e.target.value
                              ? parseFloat(e.target.value) * 1024 * 1024 * 1024
                              : -1
                          )
                        }
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Bandwidth (GB)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={
                          editForm.limits.bandwidth === -1
                            ? ""
                            : (
                                editForm.limits.bandwidth /
                                (1024 * 1024 * 1024)
                              ).toFixed(1)
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "limits.bandwidth",
                            e.target.value
                              ? parseFloat(e.target.value) * 1024 * 1024 * 1024
                              : -1
                          )
                        }
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePlan}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    per {plan.billingCycle}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {plan.limits.users === -1
                        ? "Unlimited"
                        : plan.limits.users}{" "}
                      users
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {plan.limits.books === -1
                        ? "Unlimited"
                        : plan.limits.books}{" "}
                      books
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatBytes(plan.limits.storage)} storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatBytes(plan.limits.bandwidth)} bandwidth
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Plan
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Key *
                </label>
                <input
                  type="text"
                  value={newPlanForm.key}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      key: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, ""),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="e.g., premium, enterprise"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier for the plan (lowercase, no spaces)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={newPlanForm.name}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="e.g., Premium Plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPlanForm.price}
                    onChange={(e) =>
                      setNewPlanForm((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={newPlanForm.currency}
                    onChange={(e) =>
                      setNewPlanForm((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={newPlanForm.billingCycle}
                  onChange={(e) =>
                    setNewPlanForm((prev) => ({
                      ...prev,
                      billingCycle: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="free">Free</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Limits
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Users (-1 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={
                        newPlanForm.limits.users === -1
                          ? ""
                          : newPlanForm.limits.users
                      }
                      onChange={(e) =>
                        setNewPlanForm((prev) => ({
                          ...prev,
                          limits: {
                            ...prev.limits,
                            users:
                              e.target.value === ""
                                ? -1
                                : parseInt(e.target.value) || -1,
                          },
                        }))
                      }
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Books (-1 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={
                        newPlanForm.limits.books === -1
                          ? ""
                          : newPlanForm.limits.books
                      }
                      onChange={(e) =>
                        setNewPlanForm((prev) => ({
                          ...prev,
                          limits: {
                            ...prev.limits,
                            books:
                              e.target.value === ""
                                ? -1
                                : parseInt(e.target.value) || -1,
                          },
                        }))
                      }
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Storage (GB)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={
                        newPlanForm.limits.storage === -1
                          ? ""
                          : (
                              newPlanForm.limits.storage /
                              (1024 * 1024 * 1024)
                            ).toFixed(1)
                      }
                      onChange={(e) =>
                        setNewPlanForm((prev) => ({
                          ...prev,
                          limits: {
                            ...prev.limits,
                            storage:
                              e.target.value === ""
                                ? -1
                                : parseFloat(e.target.value) *
                                    1024 *
                                    1024 *
                                    1024 || -1,
                          },
                        }))
                      }
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Bandwidth (GB)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={
                        newPlanForm.limits.bandwidth === -1
                          ? ""
                          : (
                              newPlanForm.limits.bandwidth /
                              (1024 * 1024 * 1024)
                            ).toFixed(1)
                      }
                      onChange={(e) =>
                        setNewPlanForm((prev) => ({
                          ...prev,
                          limits: {
                            ...prev.limits,
                            bandwidth:
                              e.target.value === ""
                                ? -1
                                : parseFloat(e.target.value) *
                                    1024 *
                                    1024 *
                                    1024 || -1,
                          },
                        }))
                      }
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPlan}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Plan
              </h3>
              <button
                onClick={() => setDeleteConfirm({ show: false, planKey: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete the plan "
                {plans[deleteConfirm.planKey]?.name}"? This action cannot be
                undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ show: false, planKey: null })
                  }
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlan}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Delete Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
