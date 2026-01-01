import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { Toaster } from "react-hot-toast";
import { setupAxiosInterceptors } from "./admin/utils/apiUtils";

// Pages Import
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BookDetails from "./pages/BookDetails";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ThankYouPage from "./pages/ThankYouPage";
import Footer from "./components/Footer";
import OrderDetails from "./components/Dashboard/OrderDetails";
import DiscountAlert from "./components/Home/DiscountAlert";
import AccountDetails from "./components/Dashboard/AccountDetails";
import AllNewReleases from "./pages/AllNewReleases";
import AdPopup from "./components/Home/AdPopup";
import AuthorPage from "./pages/AuthorPage";
import BlogPage from "./pages/BlogPage";
import SinglePostPage from "./pages/SinglePostPage";
import ScrollToTop from "./pages/ScrollToTop";
import HerroSlider from "./components/Home/HerroSlider";
import VerifyEmail from "./pages/VerifyEmail";
import LiveChatWidget from "./components/LiveChatWidget";

// admin
import AdminLogin from "./admin/pages/AdminLogin";
import ADminDashboard from "./admin/pages/Dashboard";
import AdminLayout from "./admin/layouts/AdminLayout";
import SuperAdminLayout from "./admin/layouts/SuperAdminLayout";
import BooksAdmin from "./admin/pages/BooksAdmin";
import DownloadsAdmin from "./admin/pages/DownloadsAdmin";
import PurchasedAdmin from "./admin/pages/PurchasedAdmin";
import TestimonialsAdmin from "./admin/pages/TestimonialsAdmin";
import UsersAdmin from "./admin/pages/UsersAdmin";
import AuthorsAdmin from "./admin/pages/AuthorsAdmin";
import BlogsAdmin from "./admin/pages/BlogsAdmin";
import AddAuthorUser from "./admin/pages/AddAuthorUser";
import AuthorUsersAdmin from "./admin/pages/AuthorUsersAdmin";
import MyProfile from "./admin/pages/MyProfile";
import Notifications from "./admin/pages/Notifications";
import WebsiteSettings from "./admin/pages/WebsiteSettings";
import ContactsAdmin from "./admin/pages/ContactsAdmin";
import LiveChatAdmin from "./admin/pages/LiveChatAdmin";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import AccessGuard from "./admin/components/AccessGuard";
// Super Admin
import SuperAdminDashboard from "./admin/pages/SuperAdminDashboard";
import SuperAdminTenants from "./admin/pages/SuperAdminTenants";
import SuperAdminCreateAdmin from "./admin/pages/SuperAdminCreateAdmin";
import SuperAdminSubscriptions from "./admin/pages/SuperAdminSubscriptions";
import SuperAdminAnalytics from "./admin/pages/SuperAdminAnalytics";
import SuperAdminAdmins from "./admin/pages/SuperAdminAdmins";
import SuperAdminEditAdmin from "./admin/pages/SuperAdminEditAdmin";
import SuperAdminCreateTenant from "./admin/pages/SuperAdminCreateTenant";
import SuperAdminCreateSubscription from "./admin/pages/SuperAdminCreateSubscription";
import SuperAdminEditSubscription from "./admin/pages/SuperAdminEditSubscription";
import SuperAdminPlans from "./admin/pages/SuperAdminPlans";
import SuperAdminEditTenant from "./admin/pages/SuperAdminEditTenant";
import SuperAdminTenantDetail from "./admin/pages/SuperAdminTenantDetail";
import SuperAdminProfile from "./admin/pages/SuperAdminProfile";

function App() {
  console.log('📱 App component rendering...')

  // Use window.location for basic route checks to avoid Router context issues
  const currentPath = window.location.pathname;
  const isHomePage = currentPath === "/";
  const isAdminRoute = currentPath.startsWith("/admin") || currentPath.startsWith("/superadmin");
  const isAuthRoute = currentPath === "/auth" || currentPath === "/verify-email";

  // Still try to use useLocation for more advanced routing if available
  let location = { pathname: currentPath };
  try {
    const routerLocation = useLocation();
    location = routerLocation;
    console.log('✅ Router context available, location:', location.pathname);
  } catch (error) {
    console.warn('⚠️ Router context not yet available, using window.location fallback');
  }

  // Initialize dark mode and axios interceptors on app load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Setup axios interceptors for automatic logout on subscription expiry
    if (isAdminRoute) {
      setupAxiosInterceptors();
    }
  }, [isAdminRoute]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* PUBLIC UI ONLY */}
      {!isAdminRoute && !isAuthRoute && <DiscountAlert />}
      {!isAdminRoute && !isAuthRoute && <Navbar />}
      {!isAdminRoute && !isAuthRoute && isHomePage && <HerroSlider />}
      {!isAdminRoute && !isAuthRoute && <LiveChatWidget />}

      {/* Wrapper size (public only) */}
      <div className={`${!isAdminRoute && !isAuthRoute ? "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : isAuthRoute ? "w-full" : ""}`}>
        <ScrollToTop />
        {!isAdminRoute && !isAuthRoute && <AdPopup />}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#f8fafc',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              zIndex: 9999,
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
              },
              icon: '✓',
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              },
              icon: '✕',
            },
          }}
        />

        <Routes>
          {/* ================= Public Pages ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/books" element={<Books />} />
          <Route path="/book/:title" element={<BookDetails />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:title" element={<SinglePostPage />} />
          <Route path="/u/:username" element={<AuthorPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/all-new-releases" element={<AllNewReleases />} />
          <Route path="/thank-you" element={<ThankYouPage />} />

          {/* Auth Page */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ================= Admin Pages ================= */}
          <Route path="/admin" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute requiredPermission="dashboard">
                <AdminLayout>
                  <ADminDashboard />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/books"
            element={
              <AdminProtectedRoute requiredPermission="books">
                <AdminLayout>
                  <BooksAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/downloads"
            element={
              <AdminProtectedRoute requiredPermission="downloads">
                <AdminLayout>
                  <DownloadsAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/purchased"
            element={
              <AdminProtectedRoute requiredPermission="purchased">
                <AdminLayout>
                  <PurchasedAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/testimonials"
            element={
              <AdminProtectedRoute requiredPermission="testimonials">
                <AdminLayout>
                  <TestimonialsAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute requiredPermission="users">
                <AdminLayout>
                  <UsersAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/authors"
            element={
              <AdminProtectedRoute requiredPermission="authors">
                <AdminLayout>
                  <AuthorsAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/blogs"
            element={
              <AdminProtectedRoute requiredPermission="blogs">
                <AdminLayout>
                  <BlogsAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/add-author-user"
            element={
              <AdminProtectedRoute requiredPermission="addAdminUser">
                <AdminLayout>
                  <AddAuthorUser />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/author-users"
            element={
              <AdminProtectedRoute requiredPermission="addAdminUser">
                <AdminLayout>
                  <AuthorUsersAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/my-profile"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <MyProfile />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Notifications />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/website-settings"
            element={
              <AdminProtectedRoute requiredPermission="dashboard">
                <AdminLayout>
                  <WebsiteSettings />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/contacts"
            element={
              <AdminProtectedRoute requiredPermission="dashboard">
                <AdminLayout>
                  <ContactsAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/live-chat"
            element={
              <AdminProtectedRoute requiredPermission="dashboard">
                <AdminLayout>
                  <LiveChatAdmin />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* ================= Super Admin Pages ================= */}
          <Route
            path="/superadmin/dashboard"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminDashboard />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/tenants"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminTenants />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/admins/create"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminCreateAdmin />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/subscriptions"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminSubscriptions />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/analytics"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminAnalytics />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/plans"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminPlans />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/admins"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminAdmins />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/admins/:id/edit"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminEditAdmin />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          {/* Tenant Management */}
          <Route
            path="/superadmin/tenants/new"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminCreateTenant />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/tenants/:id"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminTenantDetail />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/tenants/:id/edit"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminEditTenant />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/tenants/:id/create-admin"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminCreateAdmin />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          {/* Subscription Management */}
          <Route
            path="/superadmin/subscriptions/create"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminCreateSubscription />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/subscriptions/:id/edit"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminEditSubscription />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          <Route
            path="/superadmin/profile"
            element={
              <AccessGuard superAdminOnly={true}>
                <SuperAdminLayout>
                  <SuperAdminProfile />
                </SuperAdminLayout>
              </AccessGuard>
            }
          />

          {/* ================= User Dashboard ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<AccessGuard superAdminOnly={true}>Orders Section</AccessGuard>} />
            <Route path="orderdetails" element={<OrderDetails />} />
            <Route path="orderdetails/:id" element={<OrderDetails />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="downloads" element={<AccessGuard superAdminOnly={true}>Downloads Section</AccessGuard>} />
            <Route path="notifications" element={<AccessGuard superAdminOnly={true}>Notifications Section</AccessGuard>} />
            <Route path="addresses" element={<AccessGuard superAdminOnly={true}>Addresses Section</AccessGuard>} />
            <Route path="account" element={<AccountDetails />} />
          </Route>

        </Routes>
      </div>

      {/* PUBLIC FOOTER ONLY */}
      {!isAdminRoute && !isAuthRoute && <Footer />}
    </div>
  );
}

export default App;
