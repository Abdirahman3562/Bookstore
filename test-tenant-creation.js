// Test tenant creation with authentication
async function testTenantCreation() {
  try {
    // First login to get token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'canva32882@gmail.com', // From check-admins.js
        password: 'SuperAdmin123!' // Assuming default password
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.data.token;
    console.log('Got token:', token ? 'Present' : 'Missing');

    // Now create tenant
    console.log('Creating tenant...');
    const tenantResponse = await fetch('http://localhost:3000/api/superadmin/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Test Tenant 2",
        subdomain: "testtenant",
        contactEmail: "test2@example.com",
        contactName: "Test User 2"
      })
    });

    const tenantData = await tenantResponse.json();
    console.log('Tenant creation response status:', tenantResponse.status);
    console.log('Tenant creation response:', JSON.stringify(tenantData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testTenantCreation();



