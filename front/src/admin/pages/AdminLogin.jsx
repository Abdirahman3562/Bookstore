import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Mail, Key, Send, Shield, Eye, EyeOff, ArrowLeft, Clock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [otpExpiration, setOtpExpiration] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [verificationExpiration, setVerificationExpiration] = useState(null);
  const [verificationTimeRemaining, setVerificationTimeRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const login = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    // Set loading state immediately
    setLoginLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      // Check if 2-step verification is required
      if (res.data.success && res.data.requiresVerification) {
        setRequiresVerification(true);
        // Set expiration time (10 minutes)
        const expirationTime = Date.now() + 10 * 60 * 1000;
        setVerificationExpiration(expirationTime);
        setVerificationTimeRemaining(10 * 60); // 10 minutes in seconds
        toast.success("Verification code sent to your email!");
        if (res.data.verificationCode) {
          console.log(`📧 Verification code: ${res.data.verificationCode}`);
        }
        setLoginLoading(false);
        return;
      }

      // Normal login (2-step verification disabled)
      if (res.data.success && res.data.token) {
        console.log('📥 Login API response:', res.data);
        localStorage.setItem("admin_token", res.data.token);
        localStorage.setItem("admin_email", email); // Store admin email for permissions
        
        // Get user permissions from response
        const adminData = res.data.admin;
        const permissions = adminData?.permissions || {};
        const adminRole = adminData?.adminRole;

        console.log('🔐 Login successful - adminRole:', adminRole, 'adminData:', adminData);

        // Check if SUPER_ADMIN - redirect to Super Admin Dashboard
        if (adminRole === "SUPER_ADMIN") {
          console.log('👑 SUPER_ADMIN detected, redirecting to /superadmin/dashboard');
          toast.success("Login successful!");
          setTimeout(() => {
            navigate("/superadmin/dashboard");
          }, 100);
          return;
        }

        console.log('👤 Regular admin detected, redirecting to /admin/dashboard');
        
        // Determine redirect path based on permissions
        let redirectPath = "/admin/dashboard"; // Default
        
        // If user is admin, they have access to dashboard
        if (adminRole === "admin") {
          redirectPath = "/admin/dashboard";
        } else if (adminRole === "author" || permissions) {
          // Check if dashboard permission is granted
          if (permissions.dashboard === true) {
            redirectPath = "/admin/dashboard";
          } else {
            // Find first page they have permission for
            const permissionRoutes = {
              books: "/admin/books",
              downloads: "/admin/downloads",
              purchased: "/admin/purchased",
              testimonials: "/admin/testimonials",
              users: "/admin/users",
              authors: "/admin/authors",
              blogs: "/admin/blogs"
            };
            
            // Find first allowed page
            for (const [key, path] of Object.entries(permissionRoutes)) {
              if (permissions[key] === true) {
                redirectPath = path;
                break;
              }
            }
            
            // If no permissions found, default to blogs (usually allowed for authors)
            if (redirectPath === "/admin/dashboard" && permissions.blogs !== false) {
              redirectPath = "/admin/blogs";
            }
          }
        }
        
        toast.success("Login successful 🎉");
        
        // Small delay to ensure localStorage is set
        setTimeout(() => {
          navigate(redirectPath);
        }, 100);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Invalid email or password";
      toast.error(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  // Handle OTP timer
  useEffect(() => {
    if (otpExpiration && timeRemaining > 0) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiration - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) {
          setOtpExpiration(null);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpExpiration, timeRemaining]);

  // Handle verification code timer (10 minutes)
  useEffect(() => {
    if (verificationExpiration && verificationTimeRemaining > 0) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((verificationExpiration - Date.now()) / 1000));
        setVerificationTimeRemaining(remaining);
        if (remaining === 0) {
          setVerificationExpiration(null);
          toast.error("Verification code has expired. Please login again.");
          setRequiresVerification(false);
          setVerificationCode("");
          setEmail("");
          setPassword("");
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [verificationExpiration, verificationTimeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!forgotEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setSendingOTP(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/send-otp", {
        email: forgotEmail
      });

      if (response.data.success) {
        const expirationMinutes = response.data.expirationMinutes || 10;
        const expirationTime = Date.now() + expirationMinutes * 60 * 1000;
        setOtpExpiration(expirationTime);
        setTimeRemaining(expirationMinutes * 60);
        setOtpSent(true);
        setOtpVerified(false);
        setOtpCode("");
        
        const otpMessage = response.data.otp 
          ? `OTP sent! Code: ${response.data.otp} (expires in ${expirationMinutes} minutes - check console)`
          : `OTP sent to your email! (expires in ${expirationMinutes} minutes)`;
        toast.success(otpMessage, { duration: 10000 });
        
        if (response.data.otp) {
          console.log(`📧 OTP for ${forgotEmail}: ${response.data.otp} (expires in ${expirationMinutes} minutes)`);
        }
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to send OTP";
      const errorDetails = error.response?.data;
      
      // Show detailed error in console
      console.error("Error details:", errorDetails);
      
      // Show OTP in development if provided
      if (errorDetails?.otp) {
        console.log(`📧 OTP Code: ${errorDetails.otp} (valid for 10 minutes)`);
        toast.error(`${errorMessage}. OTP: ${errorDetails.otp}`, { duration: 15000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    if (timeRemaining === 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    setVerifyingOTP(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/verify-otp", {
        email: forgotEmail,
        otp: otpCode
      });

      if (response.data.success) {
        setOtpVerified(true);
        toast.success("OTP verified successfully! You can now set your new password.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error(error.response?.data?.message || "Invalid OTP code");
    } finally {
      setVerifyingOTP(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please enter both new password and confirm password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setResettingPassword(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/reset-password", {
        email: forgotEmail,
        otp: otpCode,
        newPassword: newPassword
      });

      if (response.data.success) {
        toast.success("Password reset successfully! You can now login.");
        // Reset form
        setShowForgotPassword(false);
        setForgotEmail("");
        setOtpCode("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSent(false);
        setOtpVerified(false);
        setOtpExpiration(null);
        setTimeRemaining(0);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  // Request new OTP
  const handleRequestNewOTP = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setOtpExpiration(null);
    setTimeRemaining(0);
    handleSendOTP();
  };

  // Verify login code for 2-step verification
  const handleVerifyLoginCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/verify-login-code", {
        email: email,
        code: verificationCode
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem("admin_token", response.data.token);
        localStorage.setItem("admin_email", email);
        
        const adminData = response.data.admin;
        const permissions = adminData?.permissions || {};
        const adminRole = adminData?.adminRole;
        
        // Check if SUPER_ADMIN - redirect to Super Admin Dashboard
        if (adminRole === "SUPER_ADMIN") {
          toast.success("Login successful!");
          setTimeout(() => {
            navigate("/superadmin/dashboard");
          }, 100);
          return;
        }
        
        let redirectPath = "/admin/dashboard";
        
        if (adminRole === "admin") {
          redirectPath = "/admin/dashboard";
        } else if (adminRole === "author" || permissions) {
          if (permissions.dashboard === true) {
            redirectPath = "/admin/dashboard";
          } else {
            const permissionRoutes = {
              books: "/admin/books",
              downloads: "/admin/downloads",
              purchased: "/admin/purchased",
              testimonials: "/admin/testimonials",
              users: "/admin/users",
              authors: "/admin/authors",
              blogs: "/admin/blogs"
            };
            
            for (const [key, path] of Object.entries(permissionRoutes)) {
              if (permissions[key] === true) {
                redirectPath = path;
                break;
              }
            }
            
            if (redirectPath === "/admin/dashboard" && permissions.blogs !== false) {
              redirectPath = "/admin/blogs";
            }
          }
        }
        
        toast.success("Login successful 🎉");
        setTimeout(() => {
          navigate(redirectPath);
        }, 100);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error(error.response?.data?.message || "Invalid verification code");
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full max-w-md overflow-hidden relative">
        {/* Loading Overlay - Show when login is loading */}
        {loginLoading && !requiresVerification && !showForgotPassword && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-95 flex items-center justify-center z-[100] rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Checking credentials...</p>
            </div>
          </div>
        )}
        
        {!showForgotPassword && !requiresVerification ? (
          // Login Form
          <form 
            onSubmit={login}
            className="p-6"
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Admin Login</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:outline-none"
                  placeholder="your@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-3 w-full pr-10 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:outline-none"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                  className="bg-blue-600 dark:bg-blue-500 text-white p-3 w-full rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Checking...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setForgotEmail(email); // Pre-fill with login email if available
                }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm w-full text-center"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : requiresVerification ? (
          // 2-Step Verification Form
          <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  Verification Required
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                We've sent a verification code to <strong className="text-gray-900 dark:text-white">{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Verification Code
                  </label>
                  {verificationTimeRemaining > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(verificationTimeRemaining)}</span>
                    </div>
                  )}
                </div>
                {/* OTP Input - 6 individual boxes */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={verificationCode[index] || ''}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only numbers
                        if (value) {
                          const newCode = verificationCode.split('');
                          newCode[index] = value;
                          const updatedCode = newCode.join('').slice(0, 6);
                          setVerificationCode(updatedCode);
                          
                          // Auto-focus next input
                          if (index < 5 && value) {
                            const nextInput = document.querySelector(`input[data-admin-otp-index="${index + 1}"]`);
                            if (nextInput) nextInput.focus();
                          }
                        } else {
                          // Handle backspace
                          const newCode = verificationCode.split('');
                          newCode[index] = '';
                          setVerificationCode(newCode.join(''));
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace to go to previous input
                        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                          const prevInput = document.querySelector(`input[data-admin-otp-index="${index - 1}"]`);
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(pastedData);
                        // Focus last input if pasted
                        if (pastedData.length === 6) {
                          const lastInput = document.querySelector(`input[data-admin-otp-index="5"]`);
                          if (lastInput) lastInput.focus();
                        }
                      }}
                      data-admin-otp-index={index}
                      disabled={verificationTimeRemaining === 0}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter the 6-digit code sent to your email
                </p>
                {verificationTimeRemaining === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Verification code has expired. Please login again.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyLoginCode}
                disabled={verifyingCode || !verificationCode || verificationCode.length !== 6 || verificationTimeRemaining === 0}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingCode ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Verify & Login
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequiresVerification(false);
                  setVerificationCode("");
                  setEmail("");
                  setPassword("");
                }}
                  className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm text-center"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          // Forgot Password Form
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail("");
                  setOtpCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtpExpiration(null);
                  setTimeRemaining(0);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
            </div>

            <div className="space-y-4">
              {/* Step 1: Enter Email */}
              {!otpSent && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:outline-none"
                    placeholder="Enter your email"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOTP || !forgotEmail}
                    className="mt-3 bg-blue-600 dark:bg-blue-500 text-white p-3 w-full rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sendingOTP ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send OTP
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Enter OTP */}
              {otpSent && !otpVerified && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      OTP Code
                    </label>
                    {timeRemaining > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(timeRemaining)}</span>
                      </div>
                    )}
                  </div>
                  {/* OTP Input - 6 individual boxes */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpCode[index] || ''}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only numbers
                          if (value) {
                            const newCode = otpCode.split('');
                            newCode[index] = value;
                            const updatedCode = newCode.join('').slice(0, 6);
                            setOtpCode(updatedCode);
                            
                            // Auto-focus next input
                            if (index < 5 && value) {
                              const nextInput = document.querySelector(`input[data-admin-forgot-otp-index="${index + 1}"]`);
                              if (nextInput) nextInput.focus();
                            }
                          } else {
                            // Handle backspace
                            const newCode = otpCode.split('');
                            newCode[index] = '';
                            setOtpCode(newCode.join(''));
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace to go to previous input
                          if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                            const prevInput = document.querySelector(`input[data-admin-forgot-otp-index="${index - 1}"]`);
                            if (prevInput) prevInput.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                          setOtpCode(pastedData);
                          // Focus last input if pasted
                          if (pastedData.length === 6) {
                            const lastInput = document.querySelector(`input[data-admin-forgot-otp-index="5"]`);
                            if (lastInput) lastInput.focus();
                          }
                        }}
                        data-admin-forgot-otp-index={index}
                        disabled={otpVerified || timeRemaining === 0}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={verifyingOTP || !otpCode || otpCode.length !== 6 || timeRemaining === 0}
                      className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {verifyingOTP ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                  {timeRemaining === 0 && (
                    <button
                      type="button"
                      onClick={handleRequestNewOTP}
                      className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm w-full text-center transition-colors"
                    >
                      Request New OTP
                    </button>
                  )}
                  {timeRemaining > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Enter the 6-digit code sent to {forgotEmail}
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Set New Password */}
              {otpVerified && (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      OTP verified successfully! Set your new password.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-3 w-full pr-10 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:outline-none"
                        placeholder="Enter new password (min 6 characters)"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`border p-3 w-full pr-10 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:outline-none ${
                          confirmPassword && newPassword !== confirmPassword
                            ? "border-red-300 dark:border-red-600"
                            : confirmPassword && newPassword === confirmPassword
                            ? "border-green-300 dark:border-green-600"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Confirm new password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <div className="mt-2">
                        {newPassword === confirmPassword ? (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Passwords match ✓
                            </p>
                          ) : (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Passwords do not match
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="bg-blue-600 dark:bg-blue-500 text-white p-3 w-full rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resettingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
