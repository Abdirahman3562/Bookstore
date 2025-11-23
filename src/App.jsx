import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BookDetails from "./pages/BookDetails";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Reader from "./pages/Reader";
import Books from "./pages/Books";
import CartPage from "./pages/CartPage";
import DiscountAlert from "./components/Home/DiscountAlert";
import Footer from "./components/Footer";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-2">
      <DiscountAlert />
      <Navbar />
        <Toaster position="top-right" />


      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/books" element={<Books />} />
        <Route path="/book/:title" element={<BookDetails />} />
        <Route path="/cart/" element={<CartPage />} />
        <Route path="/checkout/" element={<CheckoutPage />} />

        {/* AUTH PAGE HAL PAGE OO KELIYA */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

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


      {/* //footer */}

      <Footer/>
    </div>
  );
}

export default App;
