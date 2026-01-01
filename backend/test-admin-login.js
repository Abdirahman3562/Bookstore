import axios from "axios";

const testAdminLogin = async () => {
  try {
    console.log("🔐 Testing admin login...");

    // Try to login with the super admin
    const loginResponse = await axios.post("http://localhost:3000/api/auth/login", {
      email: "canva32882@gmail.com", // From the super admin creation
      password: "SuperAdmin123!"
    });

    if (loginResponse.data.success) {
      console.log("✅ Login successful!");
      console.log("Token:", loginResponse.data.token);
      console.log("Admin data:", loginResponse.data.admin);

      // Now test the notifications API with the token
      const token = loginResponse.data.token;
      const userId = loginResponse.data.admin._id;

      console.log("🔔 Testing notifications API...");
      const notificationsResponse = await axios.get(`http://localhost:3000/api/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("✅ Notifications API response:", notificationsResponse.data);

    } else {
      console.log("❌ Login failed:", loginResponse.data);
    }

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

testAdminLogin();
