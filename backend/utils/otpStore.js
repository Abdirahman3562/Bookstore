// In-memory OTP storage
// In production, use Redis or database
const otpStore = new Map();

const OTP_EXPIRATION_MINUTES = parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10;

export const createOTP = (email, otp) => {
  const expiresAt = Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000;
  
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0,
    verified: false
  });
};

export const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return false;
  }
  
  // Check if expired
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return false;
  }
  
  // Check attempts (max 5)
  if (stored.attempts >= 5) {
    otpStore.delete(email);
    return false;
  }
  
  // Verify OTP
  if (stored.otp !== otp) {
    stored.attempts += 1;
    otpStore.set(email, stored);
    return false;
  }
  
  // Mark as verified
  stored.verified = true;
  otpStore.set(email, stored);
  return true;
};

export const isVerified = (email) => {
  const stored = otpStore.get(email);
  return stored && stored.verified === true;
};

export const clearOTP = (email) => {
  otpStore.delete(email);
};







