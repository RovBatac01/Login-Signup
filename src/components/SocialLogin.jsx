import React, { useState } from "react";
import { BsFacebook, BsGithub } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Modal, Button, Form, Alert } from "react-bootstrap";

const SocialLogin = () => {
  const navigate = useNavigate();
  
  // Device ID Modal states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [isSubmittingDevice, setIsSubmittingDevice] = useState(false);
  const [tempUserData, setTempUserData] = useState(null); // Store user data temporarily

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

      // Store the response data temporarily
      setTempUserData(response.data);
      
      // Show device ID modal instead of immediately navigating
      setShowDeviceModal(true);

    } catch (error) {
      console.error("Google login error:", error.response?.data?.error || error.message);
      // You might want to display a user-friendly error message
      alert("Login failed: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeviceSubmit = async () => {
    if (!deviceId.trim()) {
      setDeviceError('Device ID is required');
      return;
    }

    setIsSubmittingDevice(true);
    setDeviceError('');

    try {
      // Send device ID to backend to update user record
      const updateResponse = await axios.post("https://login-signup-3470.onrender.com/api/update-device-id", {
        userId: tempUserData.userId,
        deviceId: deviceId.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${tempUserData.token}`
        }
      });

      if (updateResponse.data.success) {
        // Store all the necessary data in localStorage
        const { token, userId, email, username } = tempUserData;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', username);
        
        // Store user object with device_id
        const userObject = {
          id: userId,
          username: username,
          email: email,
          device_id: deviceId.trim(),
          role: tempUserData.role || "User"
        };
        localStorage.setItem('user', JSON.stringify(userObject));

        const userRole = tempUserData.role || "User";
        localStorage.setItem('userRole', userRole);

        console.log("✅ Google login completed with device ID:", deviceId);

        // Close modal and navigate
        setShowDeviceModal(false);
        
        // Navigate based on role
        if (userRole === "Admin") {
          navigate("/adminDB");
        } else if (userRole === "Super Admin") {
          navigate("/dashboard");
        } else {
          navigate("/userDB");
        }
      } else {
        setDeviceError('Failed to update device ID. Please try again.');
      }
    } catch (error) {
      console.error("Error updating device ID:", error);
      setDeviceError(error.response?.data?.error || 'Failed to update device ID');
    } finally {
      setIsSubmittingDevice(false);
    }
  };

  const handleDeviceModalClose = () => {
    setShowDeviceModal(false);
    setDeviceId('');
    setDeviceError('');
    setTempUserData(null);
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-3 mt-3">
        <FcGoogle
          className="social-icon"
          onClick={handleGoogleLogin}
        />
      </div>

      {/* Device ID Modal */}
      <Modal 
        show={showDeviceModal} 
        onHide={handleDeviceModalClose}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>Device Registration Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            To complete your Google login, please enter your Device ID to associate your account with a specific device.
          </p>
          
          <Form.Group className="mb-3">
            <Form.Label>Device ID <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your Device ID"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setDeviceError(''); // Clear error when user types
              }}
              disabled={isSubmittingDevice}
              className={deviceError ? 'is-invalid' : ''}
            />
            {deviceError && (
              <div className="invalid-feedback d-block">
                {deviceError}
              </div>
            )}
          </Form.Group>

          <div className="text-muted small">
            <p className="mb-1">📱 Your Device ID helps us:</p>
            <ul className="mb-0 ps-3">
              <li>Associate your account with the correct device</li>
              <li>Provide device-specific data and notifications</li>
              <li>Ensure secure access to your designated resources</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleDeviceModalClose}
            disabled={isSubmittingDevice}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleDeviceSubmit}
            disabled={isSubmittingDevice || !deviceId.trim()}
          >
            {isSubmittingDevice ? 'Submitting...' : 'Complete Login'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SocialLogin;