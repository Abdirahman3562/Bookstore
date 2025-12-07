import { useState, useEffect } from "react";
import axios from "axios";
import Aboutbooks from "../components/About/Aboutbooks";
import { BookOpen, Heart, Users, Target, Award } from "lucide-react";

export default function About() {
  const [websiteSettings, setWebsiteSettings] = useState({
    websiteName: "BookStore",
    websiteLogo: "",
  });

  // Fetch website settings
  useEffect(() => {
    const fetchWebsiteSettings = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/website-settings");
        if (response.data.success) {
          setWebsiteSettings({
            websiteName: response.data.data.websiteName || "BookStore",
            websiteLogo: response.data.data.websiteLogo || "",
          });
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
        // Keep default "BookStore" if fetch fails
      }
    };

    fetchWebsiteSettings();

    // Listen for website settings updates
    const handleSettingsUpdate = () => {
      fetchWebsiteSettings();
    };

    window.addEventListener("websiteSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("websiteSettingsUpdated", handleSettingsUpdate);
    };
  }, []);

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 dark:bg-blue-500 rounded-full mb-6 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              About Our {websiteSettings.websiteName}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
            We are passionate about connecting readers with amazing books. Our
            mission is to make reading easier, accessible, and enjoyable for
            everyone.
          </p>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <img
                src="/images/about.jpg"
                alt="About Us"
                className="relative rounded-2xl shadow-2xl w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800";
                }}
              />
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Who We Are
                </h2>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                BookStore is a digital platform built to help readers explore,
                discover, and enjoy thousands of books across different genres.
                Our mission is to create a seamless reading experience for book
                lovers around the world.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Whether you're into fiction, self-help, technology, or history,
                you will always find something inspiring here.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Passionate
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Community
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quality
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Aboutbooks />
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-6 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Mission
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
            To inspire the love of reading and provide a modern platform where
            readers can discover, buy, and download books instantly. We believe
            that knowledge should be accessible for everyone.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Founder Image */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-30"></div>
                <img
                  src="/images/founder.jpg"
                  className="relative w-32 h-32 object-cover rounded-full shadow-xl border-4 border-white dark:border-gray-700"
                  alt="Founder"
                  onError={(e) => {
                    e.target.src =
                      "https://ui-avatars.com/api/?name=Samafale&background=3B82F6&color=fff&size=128";
                  }}
                />
              </div>

              {/* Founder Info */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Samafale
                </h3>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                  Founder & Developer
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  Passionate about creating digital solutions that inspire,
                  educate, and transform the way we interact with books.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
