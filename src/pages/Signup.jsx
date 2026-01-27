import React from "react";
import { Container, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import SignupForm from "../components/SignupForm";
import SocialLogin from "../components/SocialLogin";
import "../styles/Signup/Signup.css";
import BackgroundLayout from '../components/BackgroundLayout';
import { ThemeProvider } from '../context/ThemeContext';

const Signup = () => {
  return (
    <ThemeProvider>
      <BackgroundLayout variant="blue">
        {/* Changed classname from 'signup-container' to 'signup-page-wrapper' */}
        <div className="signup-page-wrapper">
          <Container className="d-flex justify-content-center align-items-center p-5">
            <Card.Body>
              <h2 className="signup-title">Sign Up</h2>
              <p className="subtitle">Just some details to get you in!</p>

              <SignupForm />
              
              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1 text-white" />
                <span className="or">Or</span>
                <hr className="flex-grow-1 text-white" />
              </div>
              
              <SocialLogin />
              
              <div className="text-center mt-3">
                <p className="or2">
                  Already Registered?{" "}
                  <Link to="/login" className="or2">Login</Link>
                </p>
              </div>
            </Card.Body>
          </Container>
        </div>
      </BackgroundLayout>
    </ThemeProvider>
  );
};

export default Signup;