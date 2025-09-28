import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import { 
  ChevronRight, 
  ChevronDown, 
  User, 
  Lock, 
  Bell, 
  Sun, 
  Moon, 
  Save, 
  Edit, 
  KeyRound, 
  AlertCircle, 
  Mail, 
  Phone 
} from 'lucide-react';
import axios from 'axios';

// Import the CSS file
import '../styles/Pages Css/Settings.css';
import '../styles/Pages Css/Settings-improved.css';

// Define your backend API base URL
const API_BASE_URL = 'http://localhost:5000/api';

const UserSettingsPage = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // State to manage open/closed status of each section
  const [openSection, setOpenSection] = useState(null); // 'profile', 'appearance'
  
  // States to manage the visibility of nested forms within Profile Management
  const [showEditProfileForm, setShowEditProfileForm] = useState(true); // Default to showing the profile form
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const currentUser = JSON.parse(userString);
        setUsername(currentUser.username || '');
        setEmail(currentUser.email || '');
        setPhone(currentUser.phone || '');
        setReceiveNotifications(currentUser.receiveNotifications !== undefined ? currentUser.receiveNotifications : true);
      } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
      }
    }
  }, []);

  // Function to toggle section visibility
  const toggleSection = (sectionName) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
    
    // Reset forms when closing the profile section
    if (openSection === 'profile') {
      setShowEditProfileForm(true);
      setShowChangePasswordForm(false);
    }
  };

  // Function to handle saving profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not logged in. Please log in first.');
      setMessageType('error');
      return;
    }

    try {
      setIsLoading(true);
      
      // In a real app with a working backend, use this:
      // const response = await axios.put(`${API_BASE_URL}/users/profile`,
      //   { username, email, phone },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`
      //     }
      //   }
      // );
      
      // Mock successful API call for now
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      setMessage('Profile updated successfully!');
      setMessageType('success');
      
      // Update localStorage to reflect the changes
      const userString = localStorage.getItem('user');
      if (userString) {
        let currentUser = JSON.parse(userString);
        currentUser = {
          ...currentUser,
          username,
          email,
          phone
        };
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      if (error.response) {
        setMessage(error.response.data.message || 'Failed to update profile');
      } else if (error.request) {
        setMessage('No response from server. Check your internet connection.');
      } else {
        setMessage('Error setting up request to update profile.');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle changing password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not logged in. Please log in first.');
      setMessageType('error');
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setMessage('All password fields are required.');
      setMessageType('error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMessage('New password and confirm password do not match.');
      setMessageType('error');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long.');
      setMessageType('error');
      return;
    }

    try {
      setIsLoading(true);
      
      // In a real app with a working backend, use this:
      // const response = await axios.post(`${API_BASE_URL}/users/change-password`,
      //   { currentPassword, newPassword },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`
      //     }
      //   }
      // );
      
      // Mock successful API call for now
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      setMessage('Password changed successfully!');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response) {
        setMessage(error.response.data.message || 'Failed to change password');
      } else if (error.request) {
        setMessage('No response from server. Check your internet connection.');
      } else {
        setMessage('Error setting up request to change password.');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle notification preference change
  const handleToggleNotifications = async () => {
    const newPreference = !receiveNotifications;
    setReceiveNotifications(newPreference); // Optimistic update
    setMessage('');
    setMessageType('');

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not logged in. Please log in first.');
      setMessageType('error');
      setReceiveNotifications(!newPreference); // Revert optimistic update
      return;
    }

    try {
      setIsLoading(true);
      
      // In a real app with a working backend, use this:
      // const response = await axios.put(`${API_BASE_URL}/users/notifications`,
      //   { receiveNotifications: newPreference },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`
      //     }
      //   }
      // );
      
      // Mock successful API call for now
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay
      
      setMessage('Notification preferences updated!');
      setMessageType('success');

      // Update localStorage with new notification preference
      const userString = localStorage.getItem('user');
      if (userString) {
        let currentUser = JSON.parse(userString);
        currentUser = { ...currentUser, receiveNotifications: newPreference };
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error("Error updating notification preference:", error);
      if (error.response) {
        setMessage(error.response.data.message || 'Failed to update notification preference');
      } else if (error.request) {
        setMessage('No response from server. Check your internet connection.');
      } else {
        setMessage('Error setting up request to update notification preference.');
      }
      setMessageType('error');
      setReceiveNotifications(!newPreference); // Revert optimistic update on failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`settings-page-container ${theme}-theme`}>
      <Sidebar />
      <div className="settings-page-content-wrapper">
        <div className="settings-page-card-wrapper">
          <h1 className="settings-page-main-title">Settings</h1>

          {message && (
            <div className={`settings-page-message-box ${messageType === 'success' ? 'settings-page-message-success' : 'settings-page-message-error'}`}>
              <div className="settings-page-message-content">
                {messageType === 'success' ? (
                  <Save size={20} className="settings-page-message-icon" />
                ) : (
                  <AlertCircle size={20} className="settings-page-message-icon" />
                )}
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Profile Management Section */}
          <section className="settings-page-section-category">
            <h2 className="settings-page-category-header" onClick={() => toggleSection('profile')}>
              <div className="settings-page-header-content">
                <User size={24} className="settings-page-category-icon" />
                <span>Profile Management</span>
              </div>
              {openSection === 'profile' ? <ChevronDown size={20} className="settings-page-toggle-icon" /> : <ChevronRight size={20} className="settings-page-toggle-icon" />}
            </h2>
            <p className="settings-page-category-description">Manage your personal information and account security.</p>
            {openSection === 'profile' && (
              <div className="settings-page-form-wrapper">
                {/* Edit Profile Item */}
                <div className="settings-page-list-item" onClick={() => { setShowEditProfileForm(true); setShowChangePasswordForm(false); }}>
                  <div className="settings-page-item-inner">
                    <div className="settings-page-item-content">
                      <Edit size={20} className="settings-page-item-icon" />
                      <span className="settings-page-item-text">Edit Profile</span>
                    </div>
                    <div className="settings-page-item-action">
                      {showEditProfileForm ? <ChevronDown size={20} className="settings-page-item-arrow" /> : <ChevronRight size={20} className="settings-page-item-arrow" />}
                    </div>
                  </div>
                </div>
                
                {/* Content for Edit Profile (Form) */}
                {showEditProfileForm && (
                  <form onSubmit={handleSaveProfile} className="settings-page-nested-form">
                    <div className="settings-page-form-grid">
                      <div className="settings-page-form-group">
                        <label htmlFor="username" className="settings-page-form-label">Username</label>
                        <div className="settings-page-input-container">
                          <User size={18} className="settings-page-input-icon" />
                          <input
                            type="text"
                            id="username"
                            className="settings-page-input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your username"
                            required
                          />
                        </div>
                      </div>
                      <div className="settings-page-form-group">
                        <label htmlFor="email" className="settings-page-form-label">Email</label>
                        <div className="settings-page-input-container">
                          <Mail size={18} className="settings-page-input-icon" />
                          <input
                            type="email"
                            id="email"
                            className="settings-page-input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div className="settings-page-form-group">
                        <label htmlFor="phone" className="settings-page-form-label">Phone</label>
                        <div className="settings-page-input-container">
                          <Phone size={18} className="settings-page-input-icon" />
                          <input
                            type="tel"
                            id="phone"
                            className="settings-page-input-field"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g., +1234567890"
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="settings-page-button settings-page-button-primary"
                      disabled={isLoading}
                    >
                      <Save size={20} className="settings-page-button-icon" /> 
                      {isLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                )}

                {/* Change Password Item */}
                <div className="settings-page-list-item" onClick={() => { setShowChangePasswordForm(true); setShowEditProfileForm(false); }}>
                  <div className="settings-page-item-inner">
                    <div className="settings-page-item-content">
                      <KeyRound size={20} className="settings-page-item-icon" />
                      <span className="settings-page-item-text">Change Password</span>
                    </div>
                    <div className="settings-page-item-action">
                      {showChangePasswordForm ? <ChevronDown size={20} className="settings-page-item-arrow" /> : <ChevronRight size={20} className="settings-page-item-arrow" />}
                    </div>
                  </div>
                </div>
                
                {/* Content for Change Password (Form) */}
                {showChangePasswordForm && (
                  <form onSubmit={handleSavePassword} className="settings-page-nested-form">
                    <div className="settings-page-form-grid">
                      <div className="settings-page-form-group">
                        <label htmlFor="currentPassword" className="settings-page-form-label">Current Password</label>
                        <div className="settings-page-input-container">
                          <Lock size={18} className="settings-page-input-icon" />
                          <input
                            type="password"
                            id="currentPassword"
                            className="settings-page-input-field"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                          />
                        </div>
                      </div>
                      <div className="settings-page-form-group">
                        <label htmlFor="newPassword" className="settings-page-form-label">New Password</label>
                        <div className="settings-page-input-container">
                          <KeyRound size={18} className="settings-page-input-icon" />
                          <input
                            type="password"
                            id="newPassword"
                            className="settings-page-input-field"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                          />
                        </div>
                      </div>
                      <div className="settings-page-form-group">
                        <label htmlFor="confirmNewPassword" className="settings-page-form-label">Confirm New Password</label>
                        <div className="settings-page-input-container">
                          <KeyRound size={18} className="settings-page-input-icon" />
                          <input
                            type="password"
                            id="confirmNewPassword"
                            className="settings-page-input-field"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="settings-page-password-requirements">
                      <p><AlertCircle size={16} className="settings-page-info-icon" /> Password must be at least 8 characters long and include a mix of letters, numbers, and special characters.</p>
                    </div>
                    <button 
                      type="submit" 
                      className="settings-page-button settings-page-button-primary"
                      disabled={isLoading}
                    >
                      <Save size={20} className="settings-page-button-icon" /> 
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                )}
                
                {/* Notification Preferences */}

              </div>
            )}
          </section>

          {/* Appearance Section */}
          <section className="settings-page-section-category">
            <h2 className="settings-page-category-header" onClick={() => toggleSection('appearance')}>
              <div className="settings-page-header-content">
                {theme === 'dark' ? <Moon size={24} className="settings-page-category-icon" /> : <Sun size={24} className="settings-page-category-icon" />}
                <span>Appearance</span>
              </div>
              {openSection === 'appearance' ? <ChevronDown size={20} className="settings-page-toggle-icon" /> : <ChevronRight size={20} className="settings-page-toggle-icon" />}
            </h2>
            <p className="settings-page-category-description">Customize the look and feel of the application.</p>
            {openSection === 'appearance' && (
              <div className="settings-page-form-wrapper">
                {/* Theme Toggle with Enhanced UI */}
                <div className="settings-page-theme-toggle">
                  <div className={`settings-page-theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                    <Sun size={28} className={`settings-page-theme-icon ${theme === 'light' ? 'active' : ''}`} />
                    <span className={`settings-page-theme-label ${theme === 'light' ? 'active' : ''}`}>Light Mode</span>
                  </div>
                  
                  <label htmlFor="themeToggle" className="settings-page-switch-container">
                    <input
                      type="checkbox"
                      id="themeToggle"
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                      className="settings-page-theme-checkbox"
                    />
                    <span className="settings-page-slider settings-page-round"></span>
                  </label>
                  
                  <div className={`settings-page-theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                    <Moon size={28} className={`settings-page-theme-icon ${theme === 'dark' ? 'active' : ''}`} />
                    <span className={`settings-page-theme-label ${theme === 'dark' ? 'active' : ''}`}>Dark Mode</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;