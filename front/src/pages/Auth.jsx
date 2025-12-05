import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function AuthPage() {
  const navigate = useNavigate();
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [timer, setTimer] = useState(600); // 10 minutes in seconds (600)
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  // Forgot Password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOTP, setForgotPasswordOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [forgotPasswordTimer, setForgotPasswordTimer] = useState(600);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Timer countdown effect for login OTP
  useEffect(() => {
    let interval = null;
    if (requiresOTP && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requiresOTP, timer]);

  // Timer countdown effect for forgot password OTP
  useEffect(() => {
    let interval = null;
    if (showForgotPassword && forgotPasswordStep === 2 && forgotPasswordTimer > 0) {
      interval = setInterval(() => {
        setForgotPasswordTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else if (forgotPasswordTimer === 0) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showForgotPassword, forgotPasswordStep, forgotPasswordTimer]);

  // Format timer as MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // HANDLE SIGNUP
 const handleSignup = async () => {
    if (!signupData.name || !signupData.email || !signupData.password) {
      return toast.error("Please fill all fields");
    }

    if (signupData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      return toast.error("Please enter a valid email address");
    }

    setIsSigningUp(true);

    try {
      // Save user to backend users collection (with email verification)
      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
        }),
      });

      const responseData = await response.json();

      setIsSigningUp(false);

      // Check if signup was successful
      if (response.ok && responseData.success) {
        const userEmail = signupData.email; // Save email before clearing form
        const emailSent = responseData.emailSent !== false; // Default to true if not specified
        
        // Clear signup form
        setSignupData({
          name: "",
          email: "",
          password: "",
        });

        if (emailSent) {
          // Show success message with verification instructions
          toast.success(
            `Account created! Please check your email (${userEmail}) for verification link.`,
            { duration: 6000 }
          );
          
          // Show info message after a short delay to avoid overlapping
          setTimeout(() => {
            toast.info(
              "You must verify your email before you can login.",
              { duration: 5000 }
            );
          }, 1000);
        } else {
          // Email not sent - show manual verification option
          const verificationToken = responseData.verificationToken;
          if (verificationToken) {
            const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(userEmail)}`;
            toast.success(
              "Account created! However, verification email could not be sent.",
              { duration: 5000 }
            );
            setTimeout(() => {
              toast.info(
                `Please use this link to verify: ${verificationUrl}`,
                { duration: 10000 }
              );
            }, 1000);
            console.log("Verification URL:", verificationUrl);
          } else {
            toast.success(
              "Account created! Please contact support for email verification.",
              { duration: 6000 }
            );
          }
        }
      } else {
        // Handle error response
        const errorMessage = responseData.message || responseData.error || "Error creating account, please try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setIsSigningUp(false);
      // More specific error messages
      if (error.message.includes('fetch')) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
};


  // HANDLE LOGIN
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      return toast.error("Please enter both email and password.");
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Check if 2-step verification is required
        if (responseData.requiresVerification) {
          setIsLoggingIn(false);
          setRequiresOTP(true);
          setLoginEmail(loginData.email);
          setTimer(600); // Reset timer to 10 minutes
          toast.success("Verification code sent to your email!");
          if (responseData.verificationCode) {
            console.log("Verification code (dev):", responseData.verificationCode);
          }
          return;
        }

        // Normal login (no 2-step verification)
        if (responseData.data) {
          localStorage.setItem("user", JSON.stringify(responseData.data));
          toast.success("Login successful!");
          setIsLoggingIn(false);
          navigate("/dashboard");
        } else {
          setIsLoggingIn(false);
          toast.error("Login failed. Please try again.");
        }
      } else {
        setIsLoggingIn(false);
        const errorMessage = responseData.message || "Invalid email or password!";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setIsLoggingIn(false);
      toast.error("An error occurred. Please try again.");
    }
  };

  // HANDLE FORGOT PASSWORD - SEND OTP
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      return toast.error("Please enter your email address.");
    }

    setIsSendingOTP(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setIsSendingOTP(false);
        setForgotPasswordStep(2);
        setForgotPasswordTimer(600);
        toast.success("OTP code sent to your email!");
        if (responseData.otp) {
          console.log("OTP code (dev):", responseData.otp);
        }
      } else {
        setIsSendingOTP(false);
        const errorMessage = responseData.message || "Failed to send OTP. Please try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error sending forgot password OTP:", error);
      setIsSendingOTP(false);
      toast.error("An error occurred. Please try again.");
    }
  };

  // HANDLE VERIFY FORGOT PASSWORD OTP
  const handleVerifyForgotPasswordOTP = async () => {
    if (!forgotPasswordOTP || forgotPasswordOTP.length !== 6) {
      return toast.error("Please enter a valid 6-digit code.");
    }

    try {
      const response = await fetch("http://localhost:3000/api/users/verify-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          otp: forgotPasswordOTP,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setForgotPasswordStep(3);
        toast.success("OTP verified! Please enter your new password.");
      } else {
        const errorMessage = responseData.message || "Invalid or expired OTP code";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error verifying forgot password OTP:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  // HANDLE RESET PASSWORD
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      return toast.error("Please enter and confirm your new password.");
    }

    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match!");
    }

    setIsResettingPassword(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          otp: forgotPasswordOTP,
          newPassword: newPassword,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setIsResettingPassword(false);
        toast.success("Password reset successfully! You can now login.");
        // Reset all forgot password states
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
        setForgotPasswordOTP("");
        setNewPassword("");
        setConfirmNewPassword("");
        setForgotPasswordStep(1);
        setForgotPasswordTimer(600);
      } else {
        setIsResettingPassword(false);
        const errorMessage = responseData.message || "Failed to reset password. Please try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setIsResettingPassword(false);
      toast.error("An error occurred. Please try again.");
    }
  };

  // HANDLE OTP VERIFICATION
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      return toast.error("Please enter a valid 6-digit code.");
    }

    try {
      const response = await fetch("http://localhost:3000/api/users/verify-login-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          code: otpCode,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        if (responseData.data) {
          localStorage.setItem("user", JSON.stringify(responseData.data));
          toast.success("Login successful!");
          setRequiresOTP(false);
          setOtpCode("");
          setLoginEmail("");
          setTimer(600); // Reset timer
          navigate("/dashboard");
        } else {
          toast.error("Verification failed. Please try again.");
        }
      } else {
        const errorMessage = responseData.message || "Invalid or expired verification code";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-[#ffffff] min-h-screen mt-10 shadow-xl rounded-lg p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* SIGNUP FORM */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Create Account</h2>

        {isSigningUp ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Creating account...</p>
            <p className="text-gray-500 text-xs mt-2">Please wait while we set up your account</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={signupData.name}
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              onChange={(e) =>
                setSignupData({ ...signupData, name: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={signupData.email}
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              onChange={(e) =>
                setSignupData({ ...signupData, email: e.target.value })
              }
            />

            <div className="relative">
              <input
                type={showSignupPassword ? "text" : "password"}
                placeholder="Password"
                value={signupData.password}
                className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-3 top-2 mt-1 text-green-900 "
              >
                {showSignupPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <button
              onClick={handleSignup}
              disabled={isSigningUp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              Sign Up
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              By signing up, you agree to verify your email address. A verification link will be sent to your email.
            </p>
          </>
        )}
      </div>

      {/* LOGIN FORM / FORGOT PASSWORD */}
      <div>
        {!showForgotPassword ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Login</h2>

            {isLoggingIn ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Logging in...</p>
            <p className="text-gray-500 text-xs mt-2">Please wait while we verify your credentials</p>
          </div>
        ) : !requiresOTP ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={loginData.email}
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
            />

            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                value={loginData.password}
                className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2 text-green-900 mt-1 hover:text-gray-700"
              >
                {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-blue-600 hover:text-blue-700 text-sm mt-2 text-right"
            >
              Forgot Password?
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                We've sent a 6-digit verification code to <strong>{loginEmail}</strong>
              </p>
              <p className="text-xs text-blue-600 mb-2">
                Please check your email and enter the code below.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-sm font-semibold text-blue-700">Code expires in:</span>
                <span className={`text-lg font-bold ${timer < 60 ? 'text-red-600' : 'text-blue-700'}`}>
                  {formatTimer(timer)}
                </span>
              </div>
              {timer === 0 && (
                <p className="text-xs text-red-600 mt-2 text-center font-semibold">
                  Code expired! Please go back and login again to receive a new code.
                </p>
              )}
            </div>

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 text-center text-2xl tracking-widest"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only numbers
                setOtpCode(value);
              }}
            />

            <button
              onClick={handleVerifyOTP}
              disabled={timer === 0}
              className={`w-full py-3 rounded mb-2 ${
                timer === 0
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {timer === 0 ? 'Code Expired' : 'Verify Code'}
            </button>

            <button
              onClick={() => {
                setRequiresOTP(false);
                setOtpCode("");
                setLoginEmail("");
                setTimer(600); // Reset timer
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded text-sm"
            >
              Back to Login
            </button>
          </>
        )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Forgot Password</h2>

            {forgotPasswordStep === 1 && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll send you an OTP code to reset your password.
                </p>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-5 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                />

                {isSendingOTP ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-gray-600">Sending OTP...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleForgotPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded mb-2"
                  >
                    Send OTP Code
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordStep(1);
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded text-sm"
                >
                  Back to Login
                </button>
              </>
            )}

            {forgotPasswordStep === 2 && (
              <>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    We've sent a 6-digit OTP code to <strong>{forgotPasswordEmail}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mb-2">
                    Please check your email and enter the code below.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-sm font-semibold text-blue-700">Code expires in:</span>
                    <span className={`text-lg font-bold ${forgotPasswordTimer < 60 ? 'text-red-600' : 'text-blue-700'}`}>
                      {formatTimer(forgotPasswordTimer)}
                    </span>
                  </div>
                  {forgotPasswordTimer === 0 && (
                    <p className="text-xs text-red-600 mt-2 text-center font-semibold">
                      Code expired! Please go back and request a new code.
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={forgotPasswordOTP}
                  maxLength={6}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-5 transition focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 text-center text-2xl tracking-widest"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setForgotPasswordOTP(value);
                  }}
                />

                <button
                  onClick={handleVerifyForgotPasswordOTP}
                  disabled={forgotPasswordTimer === 0}
                  className={`w-full py-3 rounded mb-2 ${
                    forgotPasswordTimer === 0
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {forgotPasswordTimer === 0 ? 'Code Expired' : 'Verify Code'}
                </button>

                <button
                  onClick={() => {
                    setForgotPasswordStep(1);
                    setForgotPasswordOTP("");
                    setForgotPasswordTimer(600);
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded text-sm"
                >
                  Back
                </button>
              </>
            )}

            {forgotPasswordStep === 3 && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your new password below.
                </p>

                <div className="relative mb-4">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2 text-green-900 mt-1 hover:text-gray-700"
                  >
                    {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2 text-green-900 mt-1 hover:text-gray-700"
                  >
                    {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                {isResettingPassword ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-gray-600">Resetting password...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleResetPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded mb-2"
                  >
                    Reset Password
                  </button>
                )}

                <button
                  onClick={() => {
                    setForgotPasswordStep(2);
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded text-sm"
                >
                  Back
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
