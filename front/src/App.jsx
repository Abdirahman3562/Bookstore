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
import SuperAdminProtectedRoute from "./admin/components/SuperAdminProtectedRoute";
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

function App() {
  const location = useLocation();

  // check routes
  const isHomePage = location.pathname === "/";
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/superadmin");
  const isAuthRoute = location.pathname === "/auth" || location.pathname === "/verify-email";

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
        <Toaster position="top-right" />

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
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminDashboard />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/tenants"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminTenants />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/admins/create"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminCreateAdmin />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/subscriptions"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminSubscriptions />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/analytics"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminAnalytics />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/plans"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminPlans />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/admins"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminAdmins />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/admins/:id/edit"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminEditAdmin />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          {/* Tenant Management */}
          <Route
            path="/superadmin/tenants/new"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminCreateTenant />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/tenants/:id"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminTenantDetail />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/tenants/:id/edit"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminEditTenant />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/tenants/:id/create-admin"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminCreateAdmin />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          {/* Subscription Management */}
          <Route
            path="/superadmin/subscriptions/create"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminCreateSubscription />
                </AdminLayout>
              </SuperAdminProtectedRoute>
            }
          />

          <Route
            path="/superadmin/subscriptions/:id/edit"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout>
                  <SuperAdminEditSubscription />
                </AdminLayout>
              </SuperAdminProtectedRoute>
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
            <Route path="orders" element={<div>Orders Section</div>} />
            <Route path="orderdetails" element={<OrderDetails />} />
            <Route path="orderdetails/:id" element={<OrderDetails />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="downloads" element={<div>Downloads Section</div>} />
            <Route path="notifications" element={<div>Notifications Section</div>} />
            <Route path="addresses" element={<div>Addresses Section</div>} />
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
