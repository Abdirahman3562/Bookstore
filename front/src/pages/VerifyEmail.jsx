import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiMail } from "react-icons/fi";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email and try again.");
      return;
    }

    // Verify email with backend
    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/users/verify-email?token=${token}&email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const responseData = await response.json();

        if (response.ok && responseData.success) {
          setStatus("success");
          setMessage("Email verified successfully! You can now login.");
          toast.success("Email verified successfully!");
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/auth");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(responseData.message || responseData.error || "Verification failed. The link may have expired.");
          toast.error("Email verification failed!");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
        toast.error("Verification error occurred!");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-200">
        {status === "verifying" && (
          <>
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Verifying Email</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <FiCheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Email Verified!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login page...</p>
            <button
              onClick={() => navigate("/auth")}
              className="mt-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <FiXCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/auth")}
                className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FiMail className="w-4 h-4" />
            <span>Need help? Contact support</span>
          </div>
        </div>
      </div>
    </div>
  );
}



