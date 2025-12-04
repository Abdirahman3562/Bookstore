import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ShoppingCart, Edit, Trash2, CheckCircle, XCircle, Clock, DollarSign, RefreshCw, RotateCcw } from "lucide-react";

export default function PurchasedAdmin() {
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, order: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0
  });

  // Fetch all purchased items
  const fetchPurchased = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("🔄 Manual refresh: Fetching purchased items from database...");
      } else {
        console.log("🔄 Fetching purchased items from database...");
      }

      const response = await axios.get("http://localhost:3000/api/purchased");
      const data = response.data.data || [];
      console.log(`✅ Fetched ${data.length} purchased items from database`);

      // Log current statuses for debugging
      const statusCounts = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      console.log("📊 Current status distribution:", statusCounts);

      // Force state update by creating a new array reference
      setPurchased([...data]);

      // Calculate stats
      const items = data;
      const totalSales = items.reduce((sum, item) => sum + (item.price || 0), 0);
      const totalOrders = items.length;
      const pendingOrders = items.filter(item => item.status === 'pending').length;
      const approvedOrders = items.filter(item => item.status === 'approved' || item.status === 'active').length;

      setStats({
        totalSales,
        totalOrders,
        pendingOrders,
        approvedOrders
      });

      console.log("📈 Updated stats:", { totalSales, totalOrders, pendingOrders, approvedOrders });

      // Set last updated timestamp
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Data refreshed from database!");
      }
    } catch (error) {
      console.error("❌ Error fetching purchased items:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      toast.error("Failed to load purchased items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Frontend: Updating order ${orderId} status to: ${newStatus}`);

      // Get current order to check previous status
      const currentOrder = purchased.find(order => order._id === orderId);
      const wasCancelled = currentOrder?.status === 'cancelled';

      console.log(`📝 Frontend: Current status: ${currentOrder?.status} → New status: ${newStatus}`);

      const response = await axios.put(`http://localhost:3000/api/purchased/${orderId}/status`, {
        status: newStatus
      });

      console.log(`✅ Frontend: Backend response:`, response.data);

      const statusMessages = {
        'approved': 'Order approved successfully!',
        'cancelled': 'Order cancelled!',
        'pending': wasCancelled ? 'Order restored from cancelled status!' : 'Order status changed to pending!',
        'active': 'Order marked as active!'
      };

      toast.success(statusMessages[newStatus] || 'Order status updated!');
      await fetchPurchased(); // This will automatically refresh data from database
    } catch (error) {
      console.error("❌ Frontend Error updating order status:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      toast.error(`Failed to update order status: ${error.response?.data?.message || error.message}`);
    }
  };

  // Show delete modal
  const showDeleteModal = (order) => {
    setDeleteModal({ show: true, order });
  };

  // Hide delete modal
  const hideDeleteModal = () => {
    setDeleteModal({ show: false, order: null });
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/purchased/${deleteModal.order._id}`);
      toast.success("Order deleted successfully!");
      await fetchPurchased();
      hideDeleteModal();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      active: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Load data on component mount
  useEffect(() => {
    fetchPurchased();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchased items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Purchase Management</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchPurchased(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Refresh data from database"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Monitor book purchases and manage order fulfillment</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900 text-sm">Total Sales</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600">${stats.totalSales.toFixed(2)}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900 text-sm">Total Orders</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-900 text-sm">Pending</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900 text-sm">Approved</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.approvedOrders}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Order Management</h2>
        </div>

        <div className="p-4 sm:p-6">
          {purchased.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders will appear here when customers make purchases.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Book</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Payment</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchased.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{order.userName}</p>
                          <p className="text-gray-600 text-xs">{order.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`http://localhost:3000${order.cover}`}
                            alt={order.title}
                            className="w-10 h-14 object-cover rounded border flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40x56?text=No+Image';
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{order.title}</p>
                            <p className="text-gray-600 text-xs">by {order.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-600 text-sm">${order.price}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{order.paymentmethod}</td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(order.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 sm:gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'approved')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve Order"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel Order"
                              >
                                <XCircle className="w-3 h-3 sm:w-3 sm:h-3" />
                              </button>
                            </>
                          )}
                          {order.status === 'approved' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'active')}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as Active"
                            >
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          {order.status === 'active' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'pending')}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Change to Pending"
                            >
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          {order.status === 'cancelled' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'pending')}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Restore Order"
                            >
                              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => showDeleteModal(order)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Delete Order</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={`http://localhost:3000${deleteModal.order?.cover}`}
                  alt={deleteModal.order?.title}
                  className="w-16 h-20 object-cover rounded border flex-shrink-0 mx-auto sm:mx-0"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/64x80?text=No+Image';
                  }}
                />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{deleteModal.order?.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">by {deleteModal.order?.author}</p>
                  <p className="text-gray-600 text-sm mb-2">Customer: {deleteModal.order?.userName}</p>
                  <p className="text-red-600 font-medium text-sm sm:text-base">
                    Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from the system.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 bg-gray-50">
              <button
                onClick={hideDeleteModal}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
