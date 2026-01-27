import React, { useState, useContext } from "react";
import { Form, Button, Modal, InputGroup } from "react-bootstrap"; // Import InputGroup
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../styles/Signup/SignupForm.css';
import { ThemeContext } from '../context/ThemeContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

const SignupForm = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "User",
    });
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [showPassword, setShowPassword] = useState(false); // New state for password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // New state for confirm password visibility

    const navigate = useNavigate();
    const { theme } = useContext(ThemeContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Function to validate password
    const validatePassword = (password) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }
        if (!/\d/.test(password)) {
            return "Password must contain at least one number.";
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
            return "Password must contain at least one special character.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
            setMessage("❌ All fields are required!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage("❌ Passwords do not match!");
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setMessage(`❌ ${passwordError}`);
            return;
        }

        try {
            const response = await axios.post("https://login-signup-3470.onrender.com/users", formData);
            setMessage("✅ " + response.data.message);
            setShowModal(true);

            await axios.post("https://login-signup-3470.onrender.com/send-email", {
                email: formData.email,
                subject: "Verify Your Email",
                message: `Your verification code is: [OTP_PLACEHOLDER]`,
            });

        } catch (error) {
            // Check for specific error messages from the backend
            if (error.response && error.response.status === 409) { // Assuming 409 Conflict for duplicate
                const errorMessage = error.response.data.error;
                if (errorMessage.includes("Username already exists")) {
                    alert("This username is already taken. Please choose a different one.");
                    setMessage("❌ This username is already taken.");
                } else if (errorMessage.includes("Email already registered")) {
                    alert("This email is already registered. Please use a different email or log in.");
                    setMessage("❌ This email is already registered.");
                } else {
                    setMessage("❌ Signup failed: " + errorMessage);
                }
            } else {
                setMessage("❌ Signup failed: " + (error.response?.data.error || "Server error"));
            }
        }
    };

    const handleVerification = async () => {
        if (!verificationCode) {
            setMessage("❌ Please enter a verification code!");
            return;
        }

        try {
            const response = await axios.post("https://login-signup-3470.onrender.com/verify-code", {
                email: formData.email,
                code: verificationCode
            });

            if (response.data.success) {
                setMessage("✅ Verification successful! Redirecting...");
                setShowModal(false);
                await sendSuperAdminNotification(formData.username, formData.email, response.data.userId);
                navigate("/login");
            } else {
                setMessage("❌ Invalid verification code. Please try again.");
            }
        } catch (error) {
            console.error("❌ Verification failed:", error.response?.data || error);
            setMessage("❌ Verification failed: " + (error.response?.data.error || "Server error"));
        }
    };

    const sendSuperAdminNotification = async (username, email, userId) => {
        try {
            await axios.post("https://login-signup-3470.onrender.com/api/notifications/superadmin", {
                type: "new_user",
                title: "New User Registered",
                message: `New user "${username}" (${email}) has successfully signed up and verified their email.`,
                user_id: userId
            });
            console.log("Notification sent to Super Admin successfully.");
        } catch (error) {
            console.error("Failed to send notification to Super Admin:", error.response?.data || error.message);
        }
    };

    return (
        <>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                    <Form.Control
                        type="text"
                        placeholder="Username"
                        name="username"
                        id="username"
                        onChange={handleChange}
                        autoComplete="username"
                        className={`input-field ${theme}`}
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Control
                        type="email"
                        placeholder="Email"
                        name="email"
                        id="email"
                        onChange={handleChange}
                        autoComplete="email"
                        className={`input-field ${theme}`}
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Control
                        type="tel"
                        placeholder="Phone"
                        name="phone"
                        id="phone"
                        onChange={handleChange}
                        autoComplete="tel"
                        className={`input-field ${theme}`}
                    />
                </Form.Group>

                {/* Password Field with Show/Hide Toggle */}
                <Form.Group className="mb-4">
                    <InputGroup> {/* Use InputGroup for input and button alignment */}
                        <Form.Control
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            name="password"
                            id="password"
                            onChange={handleChange}
                            autoComplete="new-password"
                            className={`input-field ${theme}`}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                    </InputGroup>
                </Form.Group>

                {/* Confirm Password Field with Show/Hide Toggle */}
                <Form.Group className="mb-4">
                    <InputGroup> {/* Use InputGroup for input and button alignment */}
                        <Form.Control
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            name="confirmPassword"
                            id="confirmPassword"
                            onChange={handleChange}
                            autoComplete="new-password"
                            className={`input-field ${theme}`}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                    </InputGroup>
                </Form.Group>

                <Button type="submit" variant="primary" className="gradient-btn-signup">
                    Sign Up
                </Button>

                {message && (
                    <p className={`alert-signup ${message.includes("❌") ? 'error' : 'success'}`}>
                        {message}
                    </p>
                )}
            </Form>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered className={`signup-verification-modal ${theme}`}>
                <Modal.Header closeButton>
                    <Modal.Title>Email Verification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Enter the verification code sent to your email:</p>
                    <Form.Control
                        type="text"
                        placeholder="Verification Code"
                        id="verificationCode"
                        name="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        autoComplete="one-time-code"
                        className="input-field"
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleVerification} className="gradient-btn-signup">
                        Verify
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SignupForm;