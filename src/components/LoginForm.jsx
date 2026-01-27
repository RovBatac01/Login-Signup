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
  return (
    // Add 'className="terms-modal"' to the Modal component
    <Modal show={show} onHide={handleClose} centered className="terms-modal">
      <Modal.Header closeButton>
        <Modal.Title>Terms and Conditions - Data Privacy</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Sanitary Office of City Health Office of General Trias - Data Privacy Policy</h4>
        <p>
          By agreeing to these terms and conditions, you acknowledge and consent that the **Sanitary Office of City Health Office of General Trias** will have access to certain personal data you provide during the use of this application. This data is collected and processed solely for the purpose of efficient public health management, sanitation monitoring, and related governmental functions within General Trias.
        </p>
        <p>The data collected may include, but is not limited to:</p>
        <ul>
          <li><strong>Personal Identifiable Information:</strong> Name, address, contact details (phone number, email address), and other demographic information.</li>
          <li><strong>Health-Related Data:</strong> Information pertaining to sanitation practices, health inspections, and relevant health records necessary for public health interventions.</li>
          <li><strong>Usage Data:</strong> Information about how you interact with the application, such as login times and features accessed, to improve service delivery.</li>
        </ul>
        <p>
          Your data will be used to:
        </p>
        <ul>
          <li>Facilitate inspections and monitoring by the Sanitary Office.</li>
          <li>Communicate important health advisories and updates.</li>
          <li>Generate reports and statistics for public health planning (data will be anonymized where possible for reporting).</li>
          <li>Respond to inquiries and provide support related to sanitation and public health services.</li>
        </ul>
        <p>
          The Sanitary Office of City Health Office of General Trias is committed to protecting your privacy and ensuring the security of your data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines. Your data will not be shared with third parties for commercial purposes. Access to your data will be limited to authorized personnel only, who are bound by confidentiality agreements.
        </p>
        <p>
          You have the right to access, correct, and object to the processing of your personal data, subject to legal limitations. For any concerns regarding your data privacy, please contact the Sanitary Office of City Health Office of General Trias.
        </p>
        <p>
          By proceeding, you signify your understanding and acceptance of these terms.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
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
      const response = await axios.post("https://login-signup-3470.onrender.com/login", formData, {
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
          label={
            <span className={`form-check-label ${theme}`}>
              I agree to the{" "}
              <span
                onClick={handleShowTermsModal}
                style={{ cursor: 'pointer', textDecoration: 'underline', color: theme === 'dark' ? '#007bff' : '#0d6efd' }}
              >
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