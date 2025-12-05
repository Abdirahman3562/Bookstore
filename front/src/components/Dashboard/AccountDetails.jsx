import { useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { FaCamera } from "react-icons/fa";

export default function AccountDetails() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [preview, setPreview] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [twoStepVerification, setTwoStepVerification] = useState(false);
  const [originalPassword, setOriginalPassword] = useState("");

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) return;

    const userId = loggedUser._id || loggedUser.id;

    fetch(`http://localhost:3000/api/users/${userId}`)
      .then((res) => res.json())
      .then((responseData) => {
        const data = responseData.data || responseData;
        setUser(data);
        setName(data.name || "");
        setEmail(data.email || "");
        const userPassword = data.password || "";
        setPassword(userPassword);
        setConfirmPassword(userPassword);
        setOriginalPassword(userPassword);
        setAvatar(data.avatar || "");
        setPreview(data.avatar || "");
        setTwoStepVerification(data.twoStepVerification || false);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
      });
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    setAvatar(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result); // base64 preview
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    // Only check password match if password is being changed
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!user) {
      toast.error("User data not loaded");
      return;
    }

    const userId = user._id || user.id;
    const updateData = {
      name,
      email,
      avatar: preview, // base64 image directly saved!
      twoStepVerification,
    };

    // Only include password if it's different from the original (user wants to change it)
    if (password && password !== originalPassword && password.trim() !== "") {
      updateData.password = password;
      updateData.currentPassword = originalPassword; // Send current password for verification
    }

    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const updatedUserData = responseData.data || { ...user, ...updateData };
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);
        toast.success("Profile updated!");
      } else {
        const errorMessage = responseData.message || responseData.error || "Failed to update profile";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred while updating profile");
    }
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <div className="p-6 ">
      <h1 className="text-2xl text-blue-600 font-bold mb-4">Account Details</h1>

      <div className="space-y-5 ">
        <div className="flex  mb-6">
          <div
            className="lg:w-36 lg:h-36 md:w-36 md:h-36 w-44 h-44 cursor-pointer rounded-xl bg-green-100 
          flex items-center justify-center shadow-lg relative group overflow-hidden"
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-green-600 font-bold text-4xl">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </span>
            )}

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 bg-[#0f0f0fb0] flex flex-col items-center justify-center 
          rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <label
                htmlFor="profile-photo"
                className="text-white text-sm font-semibold cursor-pointer flex flex-col items-center"
              >
                <FaCamera className="text-white mb-1" />
                Change Photo
              </label>

              <input
                type="file"
                id="profile-photo"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-4">
          {/* NAME */}
          <div>
            <label className="font-semibold">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border mt-1 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="font-semibold">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border mt-1 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-4">
          {/* PASSWORD */}
          <div className="relative">
            <label className="font-semibold">Password</label>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border mt-1 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />

            <button
              className="absolute right-2 top-9"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="relative">
            <label className="font-semibold">Confirm Password</label>
            <input
              type={showConfirmPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border mt-1 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />

            <button
              className="absolute right-2 top-9"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
            >
              {showConfirmPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
        </div>

        {/* 2-STEP VERIFICATION TOGGLE */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-semibold text-lg">2-Step Verification</label>
              <p className="text-sm text-gray-600 mt-1">
                When enabled, you'll receive an OTP code via email when logging in
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoStepVerification}
                onChange={(e) => setTwoStepVerification(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          {/* SAVE BTN */}
          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
