import React from "react";
import { BsFacebook, BsGithub } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SocialLogin = () => {
  const navigate = useNavigate();

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
      const response = await axios.post("https://login-signup-3470.onrender.com/save-user", userData);
      console.log("Response data from backend:", response.data);

      const { isNewUser, hasAccess, token, userId, email, username, role } = response.data;

      if (isNewUser || !hasAccess) {
        // New user or user without access - store data and redirect to userDB
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', 'User');
        localStorage.setItem('needsDeviceAccess', 'true'); // Flag to show modal in userDB
        localStorage.setItem('isGoogleLogin', 'true'); // Flag to identify Google login
        
        console.log("🔄 New Google user - redirecting to userDB for device access request");
        navigate("/userDB");
        
      } else {
        // Existing user with access - proceed directly
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', role || "User");
        localStorage.removeItem('needsDeviceAccess'); // Clear flag if exists
        localStorage.removeItem('isGoogleLogin'); // Clear flag if exists
        
        // Store complete user object
        const userObject = {
          id: userId,
          username: username,
          email: email,
          device_id: response.data.device_id,
          role: role || "User"
        };
        localStorage.setItem('user', JSON.stringify(userObject));

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