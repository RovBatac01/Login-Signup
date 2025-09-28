import React, { useContext } from "react";
import { BsFacebook, BsGithub } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
 // Import centralized API config

const SocialLogin = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;

      console.log("Firebase user:", user);

      const userData = {
        email: user.email,
        name: user.displayName,
      };

      // Send the user data to your backend and expect a token back
      const response = await axios.post("http://localhost:5000/save-user", userData);
      console.log("Response data from backend:", response.data);
      console.log("🔍 DETAILED DEBUG - Full response.data:", JSON.stringify(response.data, null, 2));

      const { isNewUser, hasAccess, token, userId, email, username, role } = response.data;

      // DEBUG: Log the values
      console.log("🔍 Debug - isNewUser:", isNewUser);
      console.log("🔍 Debug - hasAccess:", hasAccess);
      console.log("🔍 Debug - response.data.device_id:", response.data.device_id);
      console.log("🔍 Debug - response.data.deviceId:", response.data.deviceId);
      console.log("🔍 Debug - Should show modal:", isNewUser || !hasAccess);

      if (isNewUser || !hasAccess) {
        // New user or user without access - store data and redirect to userDB
        localStorage.setItem('needsDeviceAccess', 'true'); // Flag to show modal in userDB
        localStorage.setItem('isGoogleLogin', 'true'); // Flag to identify Google login
        
        // Create user object with all necessary fields
        const userObject = {
          id: userId,
          username: username,
          email: email,
          role: 'User',
          isVerified: false, // New users are not verified
          deviceId: null,    // New users don't have device ID yet
          establishmentId: null
        };

        // Use AuthContext login function to properly set user state
        login(userObject, token);
        
        // DEBUG: Confirm flags are set
        console.log("🔍 Debug - needsDeviceAccess flag set:", localStorage.getItem('needsDeviceAccess'));
        console.log("🔍 Debug - isGoogleLogin flag set:", localStorage.getItem('isGoogleLogin'));
        console.log("🔍 Debug - User object created:", userObject);
        
        console.log("🔄 New Google user - redirecting to userDB for device access request");
        navigate("/userDB");
        
      } else {
        // Existing user with access - proceed directly
        localStorage.removeItem('needsDeviceAccess'); // Clear flag if exists
        localStorage.removeItem('isGoogleLogin'); // Clear flag if exists
        
        // Create complete user object with all fields from API response
        const userObject = {
          id: userId,
          username: username,
          email: email,
          role: role || "User",
          isVerified: Boolean(response.data.hasAccess), // ✅ ENSURE BOOLEAN: Convert to proper boolean
          deviceId: response.data.device_id || null, // ✅ Use device_id from API response
          establishmentId: response.data.establishmentId || null
        };
        
        // CRITICAL DEBUG: Verify field assignments are correct
        console.log("🔍 CRITICAL DEBUG - User object field assignments:");
        console.log("🔍 - isVerified:", userObject.isVerified, "type:", typeof userObject.isVerified);
        console.log("🔍 - deviceId:", userObject.deviceId, "type:", typeof userObject.deviceId);
        console.log("🔍 - Final userObject:", userObject);

        // Use AuthContext login function to properly set user state
        login(userObject, token);

        console.log("🔄 Existing user with access - navigating based on role");
        console.log("🔍 Debug - Existing user object:", userObject);
        
        // Navigate based on role
        if (role === "Admin") {
          navigate("/adminDB");
        } else if (role === "Super Admin") {
          navigate("/dashboard");
        } else {
          navigate("/userDB");
        }
      }

    } catch (error) {
      console.error("Google login error:", error.response?.data?.error || error.message);
      alert("Login failed: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-3 mt-3">
        <FcGoogle
          className="social-icon"
          onClick={handleGoogleLogin}
        />
      </div>
    </>
  );
};

export default SocialLogin;