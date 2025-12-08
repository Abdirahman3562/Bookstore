import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [websiteSettings, setWebsiteSettings] = useState({
    supportEmail: "support@bookstore.com",
    phoneNumber: "+123 456 789",
    location: "Mogadishu - Somalia",
  });

  // Fetch website settings
  useEffect(() => {
    const fetchWebsiteSettings = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/website-settings"
        );
        if (response.data.success) {
          const data = response.data.data;
          setWebsiteSettings({
            supportEmail: data.supportEmail || "support@bookstore.com",
            phoneNumber: data.phoneNumber || "+123 456 789",
            location: data.location || "Mogadishu - Somalia",
          });
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
        // Keep default values if fetch fails
      }
    };
    fetchWebsiteSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.error("Please login first to send a message!");
      navigate("/auth");
      return;
    }

    // Validate form
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.message.length > 500) {
      toast.error("Message cannot exceed 500 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("http://localhost:3000/api/contacts", {
        userId: user._id || user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      if (response.data.success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        // Reset form
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      } else {
        toast.error(response.data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending contact message:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-10 bg-white dark:bg-gray-900 min-h-screen py-8 transition-colors duration-200">
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
        Contact Us
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
        We'd love to hear from you! Reach us anytime.
      </p>

      {/* TOP 3 CONTACT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* Email */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <FiMail className="text-blue-600 dark:text-blue-400 text-4xl mx-auto" />
          <h3 className="text-xl font-bold text-center mt-4 text-gray-900 dark:text-white">
            Email Us
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            <a
              href={`mailto:${websiteSettings.supportEmail}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {websiteSettings.supportEmail}
            </a>
          </p>
        </div>

        {/* Phone */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <FiPhone className="text-green-600 dark:text-green-400 text-4xl mx-auto" />
          <h3 className="text-xl font-bold text-center mt-4 text-gray-900 dark:text-white">
            Call Us
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            <a
              href={`tel:${websiteSettings.phoneNumber}`}
              className="hover:text-green-600 dark:hover:text-green-400 transition"
            >
              {websiteSettings.phoneNumber}
            </a>
          </p>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <FiMapPin className="text-red-500 dark:text-red-400 text-4xl mx-auto" />
          <h3 className="text-xl font-bold text-center mt-4 text-gray-900 dark:text-white">
            Our Location
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            {websiteSettings.location}
          </p>
        </div>
      </div>

      {/* FORM + MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-16">
        {/* CONTACT FORM */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Send us a Message
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            We reply within 24 hours.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your Name"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 placeholder-gray-500 dark:placeholder-gray-400"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Your Email"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 placeholder-gray-500 dark:placeholder-gray-400"
            />

            <textarea
              rows="5"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              maxLength={500}
              placeholder="Write your message..."
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 placeholder-gray-500 dark:placeholder-gray-400"
            ></textarea>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-2">
              {formData.message.length}/500 characters
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:bg-blue-400 dark:disabled:bg-blue-600 disabled:cursor-not-allowed"
            >
              <FiSend /> {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* GOOGLE MAP */}
        <div className="rounded-xl shadow overflow-hidden h-[33rem] border border-gray-200 dark:border-gray-700">
          <iframe
            title="Location Map"
            className="w-full h-full"
            src={`https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent(websiteSettings.location || 'Mogadishu, Somalia')}&t=&z=15&ie=UTF8&iwloc=B&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            key={websiteSettings.location}
          />
        </div>
      </div>
    </div>
  );
}
