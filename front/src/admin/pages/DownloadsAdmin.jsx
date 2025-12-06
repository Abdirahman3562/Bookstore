import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Download, RotateCcw, FileText, User, Calendar, DollarSign, ShieldX, CheckCircle } from "lucide-react";
import { getCurrentAdminUser, canRevoke } from "../utils/permissions";

export default function DownloadsAdmin() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [revokeModal, setRevokeModal] = useState({ show: false, download: null });
  const [userDownloadCounts, setUserDownloadCounts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    totalUsers: 0,
    totalRevenue: 0,
    freeDownloads: 0,
    revokedDownloads: 0
  });

  // Fetch all downloads
  const fetchDownloads = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("🔄 Manual refresh: Fetching downloads from database...");
      } else {
        console.log("🔄 Fetching downloads from database...");
      }

      const response = await axios.get("http://localhost:3000/api/downloads");
      const data = response.data.data || [];
      console.log(`✅ Fetched ${data.length} downloads from database`);

      // Calculate stats
      const totalDownloads = data.length;
      const totalUsers = new Set(data.map(d => d.userId)).size;
      const totalRevenue = data.reduce((sum, d) => sum + (d.price || 0), 0);
      const freeDownloads = data.filter(d => d.price === 0).length;
      const revokedDownloads = data.filter(d => d.notDownloaded).length;

      // Calculate download count per user
      const downloadCounts = {};
      data.forEach(download => {
        downloadCounts[download.userId] = (downloadCounts[download.userId] || 0) + 1;
      });

      setStats({
        totalDownloads,
        totalUsers,
        totalRevenue,
        freeDownloads,
        revokedDownloads
      });

      setUserDownloadCounts(downloadCounts);
      setDownloads([...data]);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Data refreshed from database!");
      }
    } catch (error) {
      console.error("❌ Error fetching downloads:", error);
      toast.error("Failed to load downloads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Show revoke access modal
  const showRevokeModal = (download) => {
    setRevokeModal({ show: true, download });
  };

  // Hide revoke access modal
  const hideRevokeModal = () => {
    setRevokeModal({ show: false, download: null });
  };

  // Confirm toggle access
  const confirmToggleAccess = async () => {
    try {
      const newAccessStatus = !revokeModal.download.notDownloaded;
      await axios.patch(`http://localhost:3000/api/downloads/${revokeModal.download._id}/access`, {
        notDownloaded: newAccessStatus
      });

      const action = newAccessStatus ? 'revoked' : 'granted';
      toast.success(`Access ${action}! ${revokeModal.download.userName} ${newAccessStatus ? 'can no longer' : 'can now'} download "${revokeModal.download.title}"`);
      await fetchDownloads();
      hideRevokeModal();
    } catch (error) {
      console.error("Error toggling access:", error);
      toast.error("Failed to update download access");
    }
  };

  // Load current user and data on component mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
    };
    loadUser();
    fetchDownloads();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading downloads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Downloads Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchDownloads(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors w-full sm:w-auto text-gray-700 dark:text-gray-300"
              title="Refresh data from database"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Monitor user downloads and manage file access history</p>
     
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">Total Downloads</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalDownloads}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-green-900 dark:text-green-200 text-sm">Total Users</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalUsers}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 text-sm">Total Revenue</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">${stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm">Free Downloads</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.freeDownloads}</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <ShieldX className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-900 dark:text-red-200 text-sm">Revoked Access</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.revokedDownloads}</p>
        </div>
      </div>


      {/* Downloads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Download History</h2>
        </div>

        <div className="p-4 sm:p-6">
          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No downloads yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Downloads will appear here when users download books.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">User Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Book</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Download Count</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">Access Control</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((download) => {
                    const userDownloadCount = userDownloadCounts[download.userId] || 0;
                    return (
                      <tr key={download._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{download.userName}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">{download.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                              {userDownloadCount}
                            </span>
                          </div>
                        </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`http://localhost:3000${download.cover}`}
                            alt={download.title}
                            className="w-10 h-14 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40x56?text=No+Image';
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{download.title}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">by {download.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-bold">
                            {download.downloadCount || 1}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {(download.downloadCount || 1) === 1 ? 'time' : 'times'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400 text-sm">${download.price}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          download.price === 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        }`}>
                          {download.price === 0 ? 'Free' : 'Paid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(download.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-2">
                          {/* Access Status Indicator */}
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${download.notDownloaded ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className={`text-xs font-medium ${download.notDownloaded ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {download.notDownloaded ? 'Revoked' : 'Allowed'}
                            </span>
                          </div>

                          {/* Toggle Access Button - Always visible but disabled if no permission */}
                          <button
                            onClick={() => showRevokeModal(download)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                              download.notDownloaded
                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}
                            title={!canRevoke(currentUser, 'downloads') 
                              ? "You don't have permission to revoke access" 
                              : download.notDownloaded 
                                ? "Allow user's access to this book" 
                                : "Revoke user's access to this book"}
                            disabled={!canRevoke(currentUser, 'downloads')}
                          >
                            {download.notDownloaded ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Allow Download
                              </>
                            ) : (
                              <>
                                <ShieldX className="w-3 h-3" />
                                Revoke Access
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Revoke Access Confirmation Modal */}
      {revokeModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className={`${revokeModal.download?.notDownloaded ? 'bg-green-600 dark:bg-green-700' : 'bg-red-600 dark:bg-red-700'} p-4 sm:p-6`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {revokeModal.download?.notDownloaded ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <ShieldX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {revokeModal.download?.notDownloaded ? 'Allow Download Access' : 'Revoke Download Access'}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={`http://localhost:3000${revokeModal.download?.cover}`}
                  alt={revokeModal.download?.title}
                  className="w-16 h-20 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0 mx-auto sm:mx-0"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/64x80?text=No+Image';
                  }}
                />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">{revokeModal.download?.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">by {revokeModal.download?.author}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">User: {revokeModal.download?.userName}</p>
                  <p className={`font-medium text-sm sm:text-base ${
                    revokeModal.download?.notDownloaded ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {revokeModal.download?.notDownloaded
                      ? `Are you sure you want to allow ${revokeModal.download?.userName} to download this book again?`
                      : `Are you sure you want to revoke ${revokeModal.download?.userName}'s access to this book? This will prevent them from downloading this book.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={hideRevokeModal}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleAccess}
                className={`flex-1 px-4 py-3 rounded-lg hover:opacity-90 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  revokeModal.download?.notDownloaded
                    ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
                    : 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600'
                }`}
                disabled={!canRevoke(currentUser, 'downloads')}
              >
                {revokeModal.download?.notDownloaded ? 'Allow Download' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
