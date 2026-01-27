import React, { useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
//import Landing from "./pages/Landing";
import LandingImproved from "./pages/LandingImproved"; 
import Dashboard from "./pages/Dashboard";
import AccountManagement from "./pages/AccountManagement";
import History from "./pages/History";
import AdminDB from "./pages/adminDB";
import UserDB from "./pages/userDB";
import Notifications from "./pages/Notifications";
import UserNotif from "./pages/UserNotif";
import AdminNotif from "./pages/AdminNotif";
import SettingsPage from "./pages/Settings";
import UserSettingsPage from "./pages/UserSettings";
import AdminHistory from "./pages/AdminHsitory"; // Corrected import based on new component name
import UserHistory from "./pages/UserHistory";

import { ThemeProvider, ThemeContext } from "./context/ThemeContext";
// NEW: Import AuthProvider and AuthContext
import { AuthProvider, AuthContext } from "./context/AuthContext";

import "./styles/common/App.css";
import "./styles/theme.css";

// Protected Route Wrapper
const ProtectedRoute = ({ element, allowedRoles }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // NEW: Use AuthContext to get authentication state
    const { currentUser, userRole, authToken, isVerified } = useContext(AuthContext);
    const localStorageUserRole = localStorage.getItem("userRole");
    const localStorageToken = localStorage.getItem("token");
    let localStorageCurrentUser = null;
    const userString = localStorage.getItem('user'); 

    if (userString && userString !== "undefined" && userString !== "null") {
        try {
            localStorageCurrentUser = JSON.parse(userString);
        } catch (e) {
            console.error("Error parsing user from localStorage in ProtectedRoute:", e);
        }
    }
    const isUserVerified = localStorageCurrentUser ? localStorageCurrentUser.isVerified === true : false;

    useEffect(() => {
        // Only set the modal flag for unverified users trying to access userDB
        const currentPath = location.pathname;
        if (currentPath === "/userDB" && localStorageUserRole === "User" && !isUserVerified) {
            localStorage.setItem('showAccessModalOnLoad', 'true');
            console.log("ProtectedRoute: Set showAccessModalOnLoad for unverified User navigating to /userDB.");
        } else {
            localStorage.removeItem('showAccessModalOnLoad');
            console.log("ProtectedRoute: Cleared showAccessModalOnLoad.");
        }
    }, [location.pathname, localStorageUserRole, isUserVerified]);

    // Check if user is authenticated
    if (!localStorageUserRole || !localStorageToken) {
        console.log("ProtectedRoute: No userRole or token found, redirecting to /login");
        console.log("ProtectedRoute: userRole:", localStorageUserRole);
        console.log("ProtectedRoute: token exists:", !!localStorageToken);
        return <Navigate to="/login" replace />;
    }

    // Log the current check for debugging
    console.log(`ProtectedRoute: Checking access for path: ${location.pathname}`);
    console.log(`ProtectedRoute: User role: ${localStorageUserRole}`);
    console.log(`ProtectedRoute: Allowed roles: ${allowedRoles.join(', ')}`);
    console.log(`ProtectedRoute: Role allowed: ${allowedRoles.includes(localStorageUserRole)}`);

    // Check if user role is allowed for this route
    if (!allowedRoles.includes(localStorageUserRole)) {
        console.log(`ProtectedRoute: User role '${localStorageUserRole}' not allowed for this route. Allowed: ${allowedRoles.join(', ')}`);

        // Redirect to appropriate dashboard based on role
        if (localStorageUserRole === "User") {
            console.log("ProtectedRoute: User role trying to access restricted page, redirecting to /userDB.");
            return <Navigate to="/userDB" replace />;
        } else if (localStorageUserRole === "Admin") {
            console.log("ProtectedRoute: Admin role trying to access restricted page, redirecting to /adminDB.");
            return <Navigate to="/adminDB" replace />;
        } else if (localStorageUserRole === "Super Admin") {
            console.log("ProtectedRoute: Super Admin role trying to access restricted page, redirecting to /dashboard.");
            return <Navigate to="/dashboard" replace />;
        } else {
            console.log("ProtectedRoute: Unrecognized role trying to access a restricted page, redirecting to /login.");
            return <Navigate to="/login" replace />;
        }
    }

    console.log(`ProtectedRoute: User role '${localStorageUserRole}' is allowed for this route. Rendering element.`);
    return element;
};

const ThemedApp = () => {
    const { theme } = useContext(ThemeContext);

    return (
        <div className={`app-container ${theme}`}>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingImproved />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgotpassword" element={<ForgotPassword />} />

                    {/* Role-Based Routing for Dashboards */}
                    <Route path="/userDB" element={<ProtectedRoute element={<UserDB />} allowedRoles={["User"]} />} />
                    <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={["Super Admin"]} />} />
                    <Route path="/adminDB" element={<ProtectedRoute element={<AdminDB />} allowedRoles={["Admin"]} />} />
                    <Route path="/accountmanagement" element={<ProtectedRoute element={<AccountManagement />} allowedRoles={["Super Admin"]} />} />
                    
                    {/* History Routes - Corrected for Role-Based Navigation */}
                    <Route path="/history" element={<ProtectedRoute element={<History />} allowedRoles={["Super Admin"]} />} /> {/* Only Super Admin to /history */}
                    <Route path="/adminhistory" element={<ProtectedRoute element={<AdminHistory />} allowedRoles={["Admin"]} />} /> {/* Corrected path */}
                    <Route path="/user-history" element={<ProtectedRoute element={<UserHistory />} allowedRoles={["User"]} />} /> {/* Corrected path */}
                    
                    <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} allowedRoles={["Super Admin", "Admin"]} />} />
                    <Route path="/user-settings" element={<ProtectedRoute element={<UserSettingsPage />} allowedRoles={["User"]} />} />

                    {/* Notification Routes for each role */}
                    {/* Super Admin Notifications */}
                    <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} allowedRoles={["Super Admin"]} />} />
                    {/* User Notifications */}
                    <Route path="/usernotif" element={<ProtectedRoute element={<UserNotif />} allowedRoles={["User"]} />} />
                    {/* Admin Notifications */}
                    <Route path="/adminnotif" element={<ProtectedRoute element={<AdminNotif />} allowedRoles={["Admin"]} />} />

                    {/* Redirect any unmatched routes to login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            {/* NEW: Wrap ThemedApp with AuthProvider */}
            <AuthProvider>
                <ThemedApp />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
