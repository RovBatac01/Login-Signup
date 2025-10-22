// LoginForm.js
import React, { useState, useContext } from "react";
import { Form, Button, FormCheck, Modal } from "react-bootstrap";
import axios from "axios";
import '../styles/Login/LoginForm.css';
import '../styles/Login/LoginFormCustom.css';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// New component for the Terms and Conditions Modal
const TermsAndConditionsModal = ({ show, handleClose }) => {
  const { theme } = useTheme();
  
  return (
    <Modal show={show} onHide={handleClose} centered className="terms-modal" size="lg">
      <Modal.Header closeButton className="terms-modal-header">
        <Modal.Title className="terms-modal-title">
          Terms and Conditions
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="terms-modal-body">
        <div className="terms-content">
          <h5>Sanitary Office of City Health Office of General Trias - Data Privacy Policy</h5>
          
          <p>
            By agreeing to these terms and conditions, you acknowledge and consent that the <strong>Sanitary Office of City Health Office of General Trias</strong> will have access to certain personal data you provide during the use of this application. This data is collected and processed solely for the purpose of efficient public health management, sanitation monitoring, and related governmental functions within General Trias.
          </p>

          <h6>Data Collected</h6>
          <p>The data collected may include, but is not limited to:</p>
          <ul>
            <li><strong>Personal Identifiable Information:</strong> Name, address, contact details (phone number, email address), and other demographic information.</li>
            <li><strong>Health-Related Data:</strong> Information pertaining to sanitation practices, health inspections, and relevant health records necessary for public health interventions.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the application, such as login times and features accessed, to improve service delivery.</li>
          </ul>

          <h6>How Your Data Will Be Used</h6>
          <ul>
            <li>Facilitate inspections and monitoring by the Sanitary Office.</li>
            <li>Communicate important health advisories and updates.</li>
            <li>Generate reports and statistics for public health planning (data will be anonymized where possible for reporting).</li>
            <li>Respond to inquiries and provide support related to sanitation and public health services.</li>
          </ul>

          <h6>Data Protection & Privacy</h6>
          <p>
            The Sanitary Office of City Health Office of General Trias is committed to protecting your privacy and ensuring the security of your data in accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines. Your data will not be shared with third parties for commercial purposes. Access to your data will be limited to authorized personnel only, who are bound by confidentiality agreements.
          </p>

          <h6>Your Rights</h6>
          <p>
            You have the right to access, correct, and object to the processing of your personal data, subject to legal limitations. For any concerns regarding your data privacy, please contact the Sanitary Office of City Health Office of General Trias.
          </p>

          <p className="terms-acceptance">
            By proceeding, you signify your understanding and acceptance of these terms.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer className="terms-modal-footer">
        <Button variant="primary" onClick={handleClose} className="terms-close-btn">
          I Understand
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const LoginForm = ({ onLoginSuccess, onLoginFailure, termsChecked, setTermsChecked, loginError }) => {
  const { theme } = useTheme();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleShowTermsModal = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    onLoginFailure("");

    if (!termsChecked) {
      onLoginFailure("Please accept the terms and conditions to log in.");
      return;
    }

    if (!formData.username || !formData.password) {
      onLoginFailure("All fields are required");
      return;
    }

    try {
      const response = await axios.post("https://login-signup-production-e1ef.up.railway.app/api/auth/login", formData, {
        headers: { "Content-Type": "application/json" }
      });

      const { user, token, role } = response.data;
      login(user, token);
      onLoginSuccess(role);

    } catch (error) {
      console.error("Login error:", error.response?.data || error);
      onLoginFailure(error.response?.data?.error || "Login failed. Try again.");
    }
  };

  return (
    <Form onSubmit={handleLogin}>
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          name="username"
          placeholder="Username"
          className={`input-field ${theme}`}
          value={formData.username}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3 password-input-container">
        <Form.Control
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          className={`input-field ${theme} password-with-icon`}
          value={formData.password}
          onChange={handleChange}
          required
        />
        <span
          className={`password-toggle-icon ${theme}`}
          onClick={togglePasswordVisibility}
        >
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </span>
      </Form.Group>

      <Form.Group className="mb-3">
        <FormCheck
          type="checkbox"
          id="termsAndConditions"
          checked={termsChecked}
          onChange={(e) => setTermsChecked(e.target.checked)}
          required
          className="terms-checkbox"
          label={
            <span className={`terms-label ${theme}`}>
              I agree to the{" "}
              <span onClick={handleShowTermsModal} className="terms-link">
                Terms and Conditions
              </span>
            </span>
          }
        />
      </Form.Group>

      <Button type="submit" variant="primary" className="gradient-button-login " disabled={!termsChecked}>
        Login
      </Button>

      {loginError && (
        <p className='danger'>
          {loginError}
        </p>
      )}

      <div className="text-center mt-3">
        <a href="/forgotpassword" className={theme === 'dark' ? 'text-white' : 'text-primary'}>Forgot Password?</a>
      </div>

      <TermsAndConditionsModal show={showTermsModal} handleClose={handleCloseTermsModal} />
    </Form>
  );
};

export default LoginForm;