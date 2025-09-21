import React, { useState, useContext } from "react";
import { Container, Card, Modal } from "react-bootstrap";
import "../styles/ForgotPassword/ForgotPassword.css";
import BackgroundLayout from '../components/BackgroundLayout';
import { ThemeContext } from '../context/ThemeContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons from Font Awesome

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetToken, setResetToken] = useState(null); // ⬅️ store token

  const { theme } = useContext(ThemeContext);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('https://login-signup-3470.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setStatus({ type: 'success', message: data.message });
      setOtpSent(true);
      setShowOtpModal(true);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to send OTP. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('https://login-signup-3470.onrender.com/api/validate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // ✅ save reset token from backend response
      setResetToken(data.token);
      localStorage.setItem("resetToken", data.resetToken);

      setStatus({ type: 'success', message: 'OTP verified successfully. Proceed to reset your password.' });
      setShowOtpModal(false);
      setOtp('');
      setShowResetModal(true);
    } catch (error) {
      setStatus({ type: 'error', message: 'Invalid OTP. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: "Passwords don't match." });
      setIsLoading(false);
      return;
    }

    try {
      const token = resetToken || localStorage.getItem("resetToken");

      const response = await fetch('https://login-signup-3470.onrender.com/api/reset-password-notloggedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword, confirmPassword }), // ⬅️ include token
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setStatus({ type: 'success', message: 'Password reset successful! You can now log in.' });
      setShowResetModal(false);
      alert('Password reset successful! Redirecting to login...');
      window.location.href = '/login';
    } catch (error) {
      setStatus({ type: 'error', message: 'Password reset failed. Please try again.' });
    } finally {
      setIsLoading(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <BackgroundLayout variant="pink">
      <div className={`forgot-password-container ${theme}`}>
        <Container className="forgot-password-wrapper d-flex justify-content-center align-items-center p-5">
          <Card.Body className={`forgot-password-card-body ${theme}`}>
            <h2 className="forgot-password-title text-left">Forgot Password?</h2>
            <p className="forgot-password-description text-left">Please enter your email.</p>

            <form onSubmit={handleSubmitEmail}>
              <div className="mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className={`input-field ${theme}`}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 forgot-password-button"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              {status.message && (
                <div className={`alert mt-3 ${status.type === 'success' ? 'alert-success' : 'alert-danger'} forgot-password-status-message`}>
                  {status.message}
                </div>
              )}
            </form>

            <div className="forgot-password-footer text-center mt-3">
              <p className="forgot-password-login">
                Don't have an account? <a href="/signup" className="forgot-password-link">Signup</a>
              </p>
            </div>

          </Card.Body>
        </Container>
      </div>

      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered className={`otp-verification-modal ${theme}`}>
        <Modal.Header className="otp-modal-header">
          <Modal.Title className="otp-modal-title">OTP Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body className="otp-modal-body">
          <p className="otp-modal-description">Enter the verification code we just sent to your email address.</p>
          <form onSubmit={handleSubmitOtp}>
            <div className="mb-3">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={`input-field ${theme}`}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 otp-verify-button"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
            {status.message && (
              <div className={`alert mt-3 ${status.type === 'success' ? 'alert-success' : 'alert-danger'} otp-status-message`}>
                {status.message}
              </div>
            )}
            <div className="resend-otp-section mt-3 text-center">
              <p>Didn't receive code? <a href="#" className="resend-otp-link">Resend</a></p>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered className={`reset-password-modal ${theme}`}>
        <Modal.Header closeButton className="reset-modal-header">
          <Modal.Title className="reset-modal-title">Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body className="reset-modal-body">
          <form onSubmit={handleResetPassword}>
            <div className="mb-3 input-group">
              <input
                type={showNewPassword ? "text" : "password"}
                className={`form-control input-field ${theme}`}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="mb-3 input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`form-control input-field ${theme}`}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button
              type="submit"
              className="w-100 reset-pass-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            {status.message && (
              <div className={`alert mt-3 ${status.type === 'success' ? 'alert-success' : 'alert-danger'} reset-status-message`}>
                {status.message}
              </div>
            )}
          </form>
        </Modal.Body>
      </Modal>
    </BackgroundLayout>
  );
};

export default ForgotPassword;