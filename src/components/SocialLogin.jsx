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

      // --- IMPORTANT: Store the token received from the backend ---
      const { token, userId, email, username } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId); // Optional: Store user ID
      localStorage.setItem('userEmail', email); // Optional: Store email
      localStorage.setItem('username', username); // Optional: Store username

      console.log("Backend response (including token):", response.data);

      const userRole = response.data.role || "User"; // Get role from backend or default to 'User'
      localStorage.setItem('userRole', userRole);

      // Now the user is "logged in" on the frontend side
            if (userRole === "Admin") {
          navigate("/adminDB"); // If your backend assigns Admin role for some Google logins
      } else if (userRole === "Super Admin") {
          navigate("/dashboard"); // If your backend assigns Super Admin role
      } else {
          navigate("/userDB"); // Default for 'User' role
      }

    } catch (error) {
      console.error("Google login error:", error.response?.data?.error || error.message);
      // You might want to display a user-friendly error message
      alert("Login failed: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="d-flex justify-content-center gap-3 mt-3">
      <FcGoogle
        className="social-icon"
        onClick={handleGoogleLogin}
      />
    </div>
  );
};

export default SocialLogin;