import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
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
        message: formData.message.trim()
      });

      if (response.data.success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        // Reset form
        setFormData({
          name: "",
          email: "",
          message: ""
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
    <div className="mt-10">
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-center">Contact Us</h1>
      <p className="text-gray-600 text-center mt-2">
        We'd love to hear from you! Reach us anytime.
      </p>

      {/* TOP 3 CONTACT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* Email */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <FiMail className="text-blue-600 text-4xl mx-auto" />
          <h3 className="text-xl font-bold text-center mt-4">Email Us</h3>
          <p className="text-gray-600 text-center mt-2">
            support@bookstore.com
          </p>
        </div>

        {/* Phone */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <FiPhone className="text-green-600 text-4xl mx-auto" />
          <h3 className="text-xl font-bold text-center mt-4">Call Us</h3>
          <p className="text-gray-600 text-center mt-2">+123 456 789</p>
        </div>

        {/* Address */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <FiMapPin className="text-red-500 text-4xl mx-auto" />
          <h3 className="text-xl font-bold text-center mt-4">Our Location</h3>
          <p className="text-gray-600 text-center mt-2">Mogadishu - Somalia</p>
        </div>
      </div>

      {/* FORM + MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-16">
        {/* CONTACT FORM */}
        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-2xl font-bold">Send us a Message</h2>
          <p className="text-gray-600 mt-1">We reply within 24 hours.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your Name"
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Your Email"
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            />

            <textarea
              rows="5"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              maxLength={500}
              placeholder="Write your message..."
              className="w-full resize-none rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            ></textarea>
            <p className="text-xs text-gray-500 -mt-2 mb-2">
              {formData.message.length}/500 characters
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <FiSend /> {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* GOOGLE MAP */}
        <iframe
          title="map"
          className="rounded-xl shadow w-full lg:p-0 md:p-0 p-6 h-[33rem]"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.828523934933!2d45.3181611742072!3d2.046934698490992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3d58424d79c3df47%3A0x4ad75bb2745078e1!2sMogadishu!5e0!3m2!1sen!2sso!4v1705500000000"
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}
