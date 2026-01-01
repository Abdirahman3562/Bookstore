// Test admin login
async function testAdminLogin() {
  try {
    console.log('Testing admin login...');

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'canva32882@gmail.com',
        password: 'SuperAdmin123!'
      })
    });

    const data = await response.json();
    console.log('Login response status:', response.status);
    console.log('Login response data:', JSON.stringify(data, null, 2));

    if (data.success && data.data.token) {
      console.log('✅ Login successful, token received');

      // Test the token by making an authenticated request
      console.log('Testing token with admin API...');
      const adminResponse = await fetch('http://localhost:3000/api/admins', {
        headers: {
          'Authorization': `Bearer ${data.data.token}`
        }
      });

      console.log('Admin API response status:', adminResponse.status);
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('✅ Admin API successful:', adminData.data?.length, 'admins found');
      } else {
        console.log('❌ Admin API failed:', adminResponse.status);
        const errorData = await adminResponse.text();
        console.log('Error details:', errorData);
      }
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAdminLogin();






