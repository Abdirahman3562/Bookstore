import jwt from 'jsonwebtoken';

// The token from the user's login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTUyNjI2MjAwNDJjN2U2NzM0ZjgyMiIsImVtYWlsIjoibWFhbkBnbWFpbC5jb20iLCJhZG1pblJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7ImRhc2hib2FyZCI6dHJ1ZSwiYm9va3MiOnRydWUsImRvd25sb2FkcyI6dHJ1ZSwicHVyY2hhc2VkIjp0cnVlLCJ0ZXN0aW1vbmlhbHMiOnRydWUsInVzZXJzIjp0cnVlLCJhdXRob3JzIjp0cnVlLCJibG9ncyI6dHJ1ZSwiYWRkQWRtaW5Vc2VyIjp0cnVlLCJsaXZlQ2hhdCI6dHJ1ZSwiY29udGFjdHMiOnRydWV9LCJ0ZW5hbnRJZCI6IjY5NTUyNWQwMjAwNDJjN2U2NzM0ZjZmYiIsImlhdCI6MTczNTMxOTgzOSwiZXhwIjoxNzM1MzIzNDM5fQ.s_N43eojM-mRmt23gZIHky8REmigENhmZjG0ZUrAYqA';

const secret = process.env.JWT_SECRET || "fallback_secret_key_change_in_production";

try {
  const decoded = jwt.verify(token, secret);
  console.log('Decoded JWT token:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('Error decoding token:', error.message);
}

