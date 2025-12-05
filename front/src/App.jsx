import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { Toaster } from "react-hot-toast";

// Pages Import
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BookDetails from "./pages/BookDetails";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Reader from "./pages/Reader";
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
import AddAdminUser from "./admin/pages/AddAdminUser";
import AdminUsersAdmin from "./admin/pages/AdminUsersAdmin";
import MyProfile from "./admin/pages/MyProfile";
import Notifications from "./admin/pages/Notifications";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";

function App() {
  const location = useLocation();

  // check routes
  const isHomePage = location.pathname === "/";
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div>
      {/* PUBLIC UI ONLY */}
      {!isAdminRoute && <DiscountAlert />}
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && isHomePage && <HerroSlider />}

      {/* Wrapper size (public only) */}
      <div className={`${!isAdminRoute && "w-full max-w-[64rem] mx-auto"}`}>
        <ScrollToTop />
        <AdPopup />
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
            path="/admin/add-admin-user"
            element={
              <AdminProtectedRoute requiredPermission="addAdminUser">
                <AdminLayout>
                  <AddAdminUser />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/admin-users"
            element={
              <AdminProtectedRoute requiredPermission="addAdminUser">
                <AdminLayout>
                  <AdminUsersAdmin />
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
            <Route path="addresses" element={<div>Addresses Section</div>} />
            <Route path="account" element={<AccountDetails />} />
          </Route>

          {/* Protected Reader */}
          <Route
            path="/reader/:id"
            element={
              <ProtectedRoute>
                <Reader />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* PUBLIC FOOTER ONLY */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
