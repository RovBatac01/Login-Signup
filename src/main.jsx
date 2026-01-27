import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import Bootstrap styles
import "bootstrap/dist/css/bootstrap.min.css";

// Import Font Awesome
import "./styles/font-awesome.css";

import "./styles/ForgotPassword/ForgotPasswordForm.css";
import "./styles/Components Css/AdminAccountForm.css";
import "./styles/Components Css/AccountManagementTable.css";
import "./styles/ForgotPassword/ResetPassword.css";
import "./styles/Login/Login.css";

import "bootstrap/dist/js/bootstrap.bundle.min.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
