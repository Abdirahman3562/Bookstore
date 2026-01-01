import jwt from 'jsonwebtoken';

const decodeToken = (token) => {
  const secret = process.env.JWT_SECRET || "fallback_secret_key_change_in_production";

  try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Decoded JWT token:');
    console.log(JSON.stringify(decoded, null, 2));
    return decoded;
  } catch (error) {
    console.error('❌ Error decoding token:', error.message);
    return null;
  }
};

// You can replace this with the actual token from localStorage
const token = process.argv[2] || 'paste_token_here';

if (token && token !== 'paste_token_here') {
  decodeToken(token);
} else {
  console.log('📝 Usage: node decode-current-token.js <jwt_token>');
  console.log('💡 Get the token from browser localStorage: localStorage.getItem("admin_token")');
}



