import bcrypt from 'bcryptjs';

// The hash from the database document you showed
const hashFromDB = '$2a$10$mydxrr1yk7QmwJ3eN0Wc.Ox470HYi99j1UvJxOBVCbYb7vVaVb.Iu';
const password = 'SuperAdmin123!';

async function verifyPassword() {
  try {
    const isValid = await bcrypt.compare(password, hashFromDB);
    console.log('Password verification result:', isValid);
    console.log('Password:', password);
    console.log('Hash:', hashFromDB);

    // Also test with the original password used in create-super-admin
    const originalPassword = 'SuperAdmin123!';
    const isOriginalValid = await bcrypt.compare(originalPassword, hashFromDB);
    console.log('Original password verification result:', isOriginalValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyPassword();






