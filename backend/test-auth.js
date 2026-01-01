// Test authentication
import jwt from 'jsonwebtoken';

// Test JWT token decoding
const testToken = () => {
  // Example token structure (this would be from localStorage in frontend)
  const samplePayload = {
    id: "507f1f77bcf86cd799439011", // Example MongoDB ObjectId
    email: "admin@example.com",
    adminRole: "admin"
  };

  const secret = process.env.JWT_SECRET || "fallback_secret_key_change_in_production";

  try {
    const token = jwt.sign(samplePayload, secret, { expiresIn: '1d' });
    console.log("Generated test token:", token);

    // Decode it back
    const decoded = jwt.verify(token, secret);
    console.log("Decoded token:", decoded);

    // Check what the middleware looks for
    console.log("ID from token:", decoded.id || decoded._id);

  } catch (error) {
    console.error("JWT test failed:", error.message);
  }
};

testToken();







