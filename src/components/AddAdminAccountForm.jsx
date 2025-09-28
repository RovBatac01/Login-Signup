import React, { useState, useEffect, useContext } from "react";
import { Form, Button, Container, Card, Alert } from "react-bootstrap";
import { Eye, EyeOff } from "lucide-react"; // Import eye icons
import axios from "axios";
import "../styles/Components Css/AdminAccountForm.css";
import { ThemeContext } from "../context/ThemeContext";

const AdminCreationForm = ({ onClose, onAddAdmin }) => {
  const { theme } = useContext(ThemeContext);
  const [adminData, setAdminData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Admin", // Default to 'Admin' so checkboxes show initially
    establishmentIds: [],
  });

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [establishments, setEstablishments] = useState([]); // State to store fetched establishments
  const [isLoadingEstablishments, setIsLoadingEstablishments] = useState(false);
  const [establishmentError, setEstablishmentError] = useState("");

  // Fetch establishments on component mount
  useEffect(() => {
    const fetchEstablishments = async () => {
      setIsLoadingEstablishments(true);
      setEstablishmentError("");
      try {
        // --- FIX APPLIED HERE: Added '/api' prefix to the URL ---
        const response = await axios.get("http://localhost:5000/api/admin/establishments-for-creation");
        setEstablishments(response.data);
      } catch (error) {
        console.error("Error fetching establishments:", error.response?.data || error);
        setEstablishmentError("Failed to load establishments. Please try again.");
      } finally {
        setIsLoadingEstablishments(false);
      }
    };
    fetchEstablishments();
  }, []); // Empty dependency array means this runs once on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prevData) => {
      const newData = { ...prevData, [name]: value };

      // If the role changes from Admin to Super Admin, clear establishmentIds
      if (name === "role" && value === "Super Admin") {
        newData.establishmentIds = [];
      }
      return newData;
    });
  };

  const handleEstablishmentChange = (e) => {
    const establishmentId = parseInt(e.target.value);
    setAdminData((prevData) => ({
      ...prevData,
      establishmentIds: establishmentId ? [establishmentId] : []
    }));
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  // Toggle password visibility functions
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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

  const verifyOtp = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!otp) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/admin/verify-otp", {
        email: emailForOtp,
        code: otp,
      });

      setSuccessMessage(response.data.message || "OTP verified successfully!");
      await createAdminAccountFinalize();
    } catch (error) {
      console.error("Error verifying OTP:", error.response?.data || error);
      setErrorMessage(error.response?.data?.error || "Failed to verify OTP. Please try again.");
    }
  };

  const createAdminAccountFinalize = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    setSuccessMessage("✅ Admin account fully created and email verified!");
    onAddAdmin({
      username: adminData.username,
      email: adminData.email,
      role: adminData.role,
      establishmentIds: adminData.establishmentIds,
    });

    setTimeout(() => {
      setAdminData({ username: "", email: "", password: "", confirmPassword: "", role: "Admin", establishmentIds: [] });
      setOtp("");
      setShowOtpInput(false);
      setIsOtpSent(false);
      setErrorMessage("");
      setSuccessMessage("");
      setEmailForOtp("");
      // Reset password visibility states
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Conditional validation for establishmentIds based on role
    if (!adminData.username || !adminData.email || !adminData.password || !adminData.confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (adminData.role === "Admin" && adminData.establishmentIds.length === 0) {
      setErrorMessage("Please select an establishment for an 'Admin' role.");
      return;
    }

    if (adminData.password !== adminData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const passwordError = validatePassword(adminData.password);
    if (passwordError) {
      setErrorMessage(`❌ ${passwordError}`);
      return;
    }

    if (!isOtpSent) {
      try {
        const response = await axios.post("http://localhost:5000/admin", {
          username: adminData.username,
          email: adminData.email,
          password: adminData.password,
          confirmPassword: adminData.confirmPassword,
          role: adminData.role,
          // Only send establishmentIds if role is 'Admin'
          establishmentIds: adminData.role === 'Admin' ? adminData.establishmentIds : [],
        }, {
          headers: { "Content-Type": "application/json" }
        });

        console.log("Admin creation response from /admin endpoint:", response.data);
        setSuccessMessage(response.data.message);

        setEmailForOtp(adminData.email);
        setShowOtpInput(true);
        setIsOtpSent(true);

      } catch (error) {
        console.error("Admin creation error (from /admin endpoint):", error.response?.data || error);
        setErrorMessage(error.response?.data?.error || "Failed to create admin.");
      }
    } else {
      verifyOtp();
    }
  };

  return (
    <Container className={`admin-form-container ${theme}`}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {/* Admin Username, Email - remain unchanged */}
          <Form.Group className="admin-form-group">
            <Form.Label className="admin-form-label">Admin Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={adminData.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              required
              disabled={isOtpSent}
              className="admin-username-input"
            />
          </Form.Group>

          <Form.Group className="admin-form-group">
            <Form.Label className="admin-form-label">Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={adminData.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
              disabled={isOtpSent}
              className="admin-username-input"
            />
          </Form.Group>

          {/* Password field with show/hide functionality */}
          <Form.Group className="admin-form-group">
            <Form.Label className="admin-form-label">Password</Form.Label>
            <div className="password-input-container">
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                value={adminData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                disabled={isOtpSent}
                className="admin-username-input password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={isOtpSent}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Form.Group>

          {/* Confirm Password field with show/hide functionality */}
          <Form.Group className="admin-form-group">
            <Form.Label className="admin-form-label">Confirm Password</Form.Label>
            <div className="password-input-container">
              <Form.Control
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={adminData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
                disabled={isOtpSent}
                className="admin-username-input password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                disabled={isOtpSent}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Form.Group>

          {/* Role Dropdown */}
          <Form.Group className="admin-form-group">
            <Form.Label className="admin-form-label">Role</Form.Label>
            <Form.Control
              as="select"
              name="role"
              value={adminData.role}
              onChange={handleChange} // This handleChange will now also handle role change
              required
              disabled={isOtpSent}
              className="admin-username-input"
            >
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </Form.Control>
          </Form.Group>

          {/* Conditional Rendering for Establishment Assignment */}
          {adminData.role === "Admin" && ( // ONLY SHOW THIS GROUP IF ROLE IS 'Admin'
            <Form.Group className="admin-form-group">
              <Form.Label className="admin-form-label">Assign to Establishments</Form.Label>
              {isLoadingEstablishments ? (
                <p>Loading establishments...</p>
              ) : establishmentError ? (
                <Alert variant="danger">{establishmentError}</Alert>
              ) : establishments.length > 0 ? (
                <Form.Control
                  as="select"
                  name="establishmentId"
                  value={adminData.establishmentIds[0] || ""}
                  onChange={handleEstablishmentChange}
                  disabled={isOtpSent}
                  className="admin-username-input"
                >
                  <option value="" disabled>Select an establishment</option>
                  {establishments.map((establishment) => (
                    <option 
                      key={establishment.id} 
                      value={establishment.id}
                    >
                      {establishment.estab_name}
                    </option>
                  ))}
                </Form.Control>
              ) : (
                <Alert variant="info" className="mt-2">
                  No establishments found. Please add establishments first.
                </Alert>
              )}
            </Form.Group>
          )}

          {/* OTP Input Field - remains unchanged */}
          {showOtpInput && (
            <Form.Group className="admin-form-group mt-3">
              <Form.Label className="admin-form-label">OTP</Form.Label>
              <Form.Control
                type="text"
                name="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder="Enter OTP"
                required
                />
            </Form.Group>
          )}

          {/* Messages - remain unchanged */}
          {errorMessage && <Alert variant="danger" className="mt-3">{errorMessage}</Alert>}
          {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}

          {/* Buttons - remain unchanged */}
          <div className="admin-form-buttons">
            {!isOtpSent ? (
              <Button type="submit"> Send OTP</Button>
            ) : (
              <Button type="submit">Verify OTP & Finalize Admin</Button>
            )}
            <Button onClick={onClose} variant="secondary">Cancel</Button>
          </div>
        </Form>
      </Card.Body>
    </Container>
  );
};

export default AdminCreationForm;