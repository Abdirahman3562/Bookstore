import axios from "axios";

// Test script to create a purchase and verify notifications are created
const testPurchaseNotifications = async () => {
  try {
    console.log("🧪 Testing purchase notification system...");

    // First, try to login as admin to get token
    console.log("🔐 Attempting admin login...");
    const adminLogin = await axios.post("http://localhost:3000/api/auth/login", {
      email: "samafalemohamed54@gmail.com",
      password: "admin123" // You may need to change this
    });

    if (!adminLogin.data.success) {
      console.log("❌ Admin login failed, trying different credentials...");
      console.log("Available admins:");
      console.log("- samafalemohamed54@gmail.com");
      console.log("- maanow@gmail.com");
      console.log("- canva32882@gmail.com (super admin)");
      return;
    }

    const token = adminLogin.data.token;
    console.log("✅ Admin login successful");

    // Get existing books to purchase
    console.log("📚 Getting available books...");
    const booksResponse = await axios.get("http://localhost:3000/api/books", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!booksResponse.data.success || !booksResponse.data.data.length) {
      console.log("❌ No books available for purchase");
      return;
    }

    const book = booksResponse.data.data[0];
    console.log(`📖 Selected book: ${book.title} by ${book.author}`);

    // Create a test purchase
    console.log("🛒 Creating test purchase...");
    const purchaseData = {
      bookId: book._id,
      title: book.title,
      author: book.author,
      price: book.price || 10,
      cover: book.cover,
      userName: "Test User",
      email: "test@example.com",
      userId: "507f1f77bcf86cd799439011" // Dummy user ID
    };

    const purchaseResponse = await axios.post("http://localhost:3000/api/purchased", purchaseData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (purchaseResponse.data.success) {
      console.log("✅ Purchase created successfully!");
      console.log("📋 Purchase details:", {
        id: purchaseResponse.data.data._id,
        title: purchaseResponse.data.data.title,
        status: purchaseResponse.data.data.status
      });

      // Check notifications
      console.log("🔔 Checking notifications after purchase...");
      const notificationsResponse = await axios.get("http://localhost:3000/api/notifications/debug/all");

      if (notificationsResponse.data.success) {
        const newNotifications = notificationsResponse.data.notifications.filter(n =>
          n.message.includes(purchaseData.title)
        );
        console.log(`✅ Found ${newNotifications.length} notifications for the new purchase:`);
        newNotifications.forEach(n => {
          console.log(`   - ${n.title} (${n.type}) for user ${n.userId}`);
        });
      }

      console.log("\n🎉 Notification system test completed!");
      console.log("Admin notifications should now show the pending purchase.");
      console.log("To approve the purchase, go to admin panel and approve it.");
      console.log("Then the user should get an approval notification.");

    } else {
      console.log("❌ Failed to create purchase:", purchaseResponse.data);
    }

  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
};

testPurchaseNotifications();



