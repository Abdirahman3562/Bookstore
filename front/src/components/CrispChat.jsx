import { useEffect } from "react";

export default function CrispChat() {
  useEffect(() => {
    // Wait for Crisp to be fully loaded
    const initializeCrisp = () => {
      if (window.$crisp && window.$crisp.is) {
        // Set user information if user is logged in
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          // Set user data in Crisp
          window.$crisp.push(["set", "user:email", user.email || ""]);
          window.$crisp.push(["set", "user:nickname", user.name || ""]);
          
          // Set user avatar if available
          if (user.avatar) {
            window.$crisp.push(["set", "user:avatar", user.avatar]);
          }
        }

        // Configure Crisp settings
        window.$crisp.push(["set", "session:segments", ["website"]]);
        
        // Configure Crisp to use smaller, more compact size
        // Note: Crisp widget size is controlled via CSS in index.css
      } else {
        // Retry after a short delay if Crisp isn't loaded yet
        setTimeout(initializeCrisp, 100);
      }
    };

    // Start initialization
    initializeCrisp();

    // Listen for user login/logout events
    const handleUserChange = () => {
      if (window.$crisp && window.$crisp.is) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          window.$crisp.push(["set", "user:email", user.email || ""]);
          window.$crisp.push(["set", "user:nickname", user.name || ""]);
          if (user.avatar) {
            window.$crisp.push(["set", "user:avatar", user.avatar]);
          }
        } else {
          // Clear user data on logout
          window.$crisp.push(["set", "user:email", ""]);
          window.$crisp.push(["set", "user:nickname", ""]);
          window.$crisp.push(["set", "user:avatar", ""]);
        }
      }
    };

    // Listen for storage changes (user login/logout)
    window.addEventListener("storage", handleUserChange);
    
    // Also listen for custom events if you trigger them on login/logout
    window.addEventListener("userLoggedIn", handleUserChange);
    window.addEventListener("userLoggedOut", handleUserChange);

    return () => {
      window.removeEventListener("storage", handleUserChange);
      window.removeEventListener("userLoggedIn", handleUserChange);
      window.removeEventListener("userLoggedOut", handleUserChange);
    };
  }, []);

  // This component doesn't render anything
  // Crisp chat widget is automatically added by the script in index.html
  return null;
}

