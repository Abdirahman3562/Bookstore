import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-2">
      <Navbar />
      <Toaster position="top-right" />
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/books" element={<Books />} />
        <Route path="/book/:title" element={<BookDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />

        {/* Auth Page */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Dashboard tab (index route) */}
          <Route index element={<Dashboard />} /> {/* This is the default Dashboard tab */}
          <Route path="orders" element={<div>Orders Section</div>} />
          <Route path="downloads" element={<div>Downloads Section</div>} />
          <Route path="addresses" element={<div>Addresses Section</div>} />
          <Route path="account" element={<div>Account Section</div>} />
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

      <Footer />
    </div>
  );
}

export default App;
