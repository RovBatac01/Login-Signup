// Login.jsx
import React, { useState } from "react";
import { Container, Card, Modal, Form, Button } from "react-bootstrap";
import LoginForm from "../components/LoginForm";
import SocialLogin from "../components/SocialLogin";
import "../styles/Login/Login.css";
import BackgroundLayout from '../components/BackgroundLayout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';


const Login = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleShowTermsModal = () => setShowTermsModal(true);
  const handleTermsCheckboxChange = (e) => setTermsChecked(e.target.checked);

  const handleLoginSuccess = (userRole) => {
    setLoginError("");

    if (userRole === "User") {
      localStorage.setItem("showAccessModalOnLoad", "true");
    }

    switch (userRole) {
      case "Super Admin":
        navigate("/dashboard", { replace: true });
        break;
      case "Admin":
        navigate("/adminDB", { replace: true });
        break;
      case "User":
        navigate("/userDB", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
        break;
    }
  };

  const handleLoginFailure = (errorMessage) => {
    setLoginError(errorMessage);
  };

  return (
    <BackgroundLayout variant="purple">
      {/* Apply theme class to the outermost container */}
      <div className={`login-container ${theme}`}>
        <Container className="login-container-inner d-flex justify-content-center align-items-center p-5">
          {/* Apply theme class to the Card.Body */}
          <Card.Body className={`login-card-body ${theme}`}>
            {/* Apply theme-specific text colors */}
            <h2 className={`login-title text-left ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>Login</h2>
            <p className={`login-subtitle text-left ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>Glad you're back!</p>

            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onLoginFailure={handleLoginFailure}
              termsChecked={termsChecked}
              setTermsChecked={setTermsChecked}
              loginError={loginError}
            />

            <div className="login-divider d-flex align-items-center my-3">
              {/* Apply theme-specific hr and text colors */}
              <hr className={`login-hr flex-grow-1 ${theme === 'dark' ? 'text-white' : 'text-dark'}`} />
              <span className={`login-or-text mx-2 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>Or</span>
              <hr className={`login-hr flex-grow-1 ${theme === 'dark' ? 'text-white' : 'text-dark'}`} />
            </div>

            <SocialLogin />

            <div className="login-signup-link text-center mt-3">
              {/* Apply theme-specific text colors */}
              <p className={`login-signup-text ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
                Don't have an account? <a href="/signup" className={`login-signup-link-text ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>Signup</a>
              </p>
            </div>
            <div className="login-footer text-center small">
            </div>
          </Card.Body>
        </Container>
      </div>
    </BackgroundLayout>
  );
};

export default Login;