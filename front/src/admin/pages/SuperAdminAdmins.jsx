import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiUtils";
import {
  Users,
  Search,
  Crown,
  Shield,
  User,
  Edit,
  Trash2,
  Building2,
  MoreVertical
} from "lucide-react";
import toast from "react-hot-toast";

export default function SuperAdminAdmins() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAdmins();
  }, [page, roleFilter, searchTerm]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      const params = {
        page,
        limit: 10,
        ...(roleFilter && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await axios.get("http://localhost:3000/api/superadmin/admins", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setAdmins(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      handleApiError(error, "admins");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'author':
        return <User className="w-5 h-5 text-green-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Admin
          </span>
        );
      case 'author':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Author
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Unknown
          </span>
        );
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
    <div className="p-4 sm:p-6 w-full ">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="lg:text-3xl text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all admin users across the platform
          </p>
        </div>
        <button
          onClick={() => navigate("/superadmin/admins/create")}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Users className="w-5 h-5" />
          Create Admin
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="author">Author</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {admins.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No admins found</p>
            <button
              onClick={() => navigate("/superadmin/admins/create")}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first admin
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {admins.map((admin) => (
                    <tr
                      key={admin._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {admin.avatar ? (
                            <img
                              src={admin.avatar}
                              alt={admin.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=3B82F6&color=fff&size=128`;
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {admin.name
                                ? admin.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                : "A"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {admin.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(admin.adminRole)}
                      </td>
                      <td className="px-6 py-4">
                        {admin.tenantId ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Assigned to tenant
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            Platform-wide
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/superadmin/admins/${admin._id}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
