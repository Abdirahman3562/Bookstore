// Test tenant creation
async function testTenantCreation() {
  try {
    const response = await fetch('http://localhost:3000/api/superadmin/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Test Tenant",
        contactEmail: "test@example.com",
        contactName: "Test User"
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testTenantCreation();



