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
  const [tempUserData, setTempUserData] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null); // 'pending', 'approved', 'denied'

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
        // New user or user without access - show device modal
        setTempUserData(response.data);
        setShowDeviceModal(true);
      } else {
        // Existing user with access - proceed directly
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', role || "User");
        
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

  const handleDeviceSubmit = async () => {
    if (!deviceId.trim()) {
      setDeviceError('Device ID is required');
      return;
    }

    setIsSubmittingDevice(true);
    setDeviceError('');

    try {
      // Submit access request with device ID
      const requestResponse = await axios.post("https://login-signup-3470.onrender.com/api/request-device-access", {
        userId: tempUserData.userId,
        deviceId: deviceId.trim(),
        email: tempUserData.email,
        username: tempUserData.username
      }, {
        headers: {
          'Authorization': `Bearer ${tempUserData.token}`
        }
      });

      if (requestResponse.data.success) {
        setAccessStatus('pending');
        
        // Store minimal data for pending user
        localStorage.setItem('token', tempUserData.token);
        localStorage.setItem('userId', tempUserData.userId);
        localStorage.setItem('userEmail', tempUserData.email);
        localStorage.setItem('username', tempUserData.username);
        localStorage.setItem('userRole', 'User');
        localStorage.setItem('accessStatus', 'pending');
        
        console.log("✅ Access request submitted for device ID:", deviceId);
        
        // Show success message and redirect after delay
        setTimeout(() => {
          setShowDeviceModal(false);
          navigate("/userDB"); // Navigate to user dashboard with pending status
        }, 2000);
        
      } else {
        setDeviceError('Failed to submit access request. Please try again.');
      }
    } catch (error) {
      console.error("Error submitting access request:", error);
      setDeviceError(error.response?.data?.error || 'Failed to submit access request');
    } finally {
      setIsSubmittingDevice(false);
    }
  };

  const handleDeviceModalClose = () => {
    setShowDeviceModal(false);
    setDeviceId('');
    setDeviceError('');
    setTempUserData(null);
    setAccessStatus(null);
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-3 mt-3">
        <FcGoogle
          className="social-icon"
          onClick={handleGoogleLogin}
        />
      </div>

      {/* Device Access Request Modal */}
      <Modal 
        show={showDeviceModal} 
        onHide={accessStatus === 'pending' ? undefined : handleDeviceModalClose}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton={accessStatus !== 'pending'}>
          <Modal.Title>
            {accessStatus === 'pending' ? '✅ Access Request Submitted' : '🔐 Device Access Required'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {accessStatus === 'pending' ? (
            <div className="text-center">
              <div className="mb-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h5 className="text-success mb-3">Request Submitted Successfully!</h5>
              <p className="mb-2">
                Your access request for device <strong>{deviceId}</strong> has been submitted.
              </p>
              <p className="mb-2">
                An admin will review your request and approve access to the device.
              </p>
              <p className="text-muted small">
                You will be redirected to your dashboard where you can check the status of your request.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3">
                To complete your Google login, please enter the Device ID you want to access. 
                Your request will be sent to the admin for approval.
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>Device ID <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter the Device ID you want to access"
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setDeviceError('');
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

              <div className="bg-light p-3 rounded">
                <h6 className="mb-2">📋 What happens next:</h6>
                <ol className="mb-0 ps-3 small">
                  <li>Your access request will be sent to the device admin</li>
                  <li>The admin will review and approve/deny your request</li>
                  <li>You'll receive a notification once approved</li>
                  <li>After approval, you can access device-specific features</li>
                </ol>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {accessStatus !== 'pending' && (
            <>
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
                {isSubmittingDevice ? 'Submitting Request...' : 'Request Access'}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SocialLogin;