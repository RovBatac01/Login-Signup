import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || null;
  });

  const [establishmentId, setEstablishmentId] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.establishmentId || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to parse establishmentId from localStorage user", error);
      return null;
    }
  });

  /// NEW: Add deviceId to state if it exists in currentUser
  const [deviceId, setDeviceId] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.deviceId || null; // Access deviceId from the parsed user object
      }
      return null;
    } catch (error) {
      console.error("Failed to parse deviceId from localStorage user", error);
      return null;
    }
  });


  // Effect to update localStorage whenever currentUser, userRole, establishmentId, or deviceId changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser));

      if (currentUser.role) {
        localStorage.setItem('userRole', currentUser.role);
        setUserRole(currentUser.role);
      } else {
        localStorage.removeItem('userRole');
        setUserRole(null);
      }

      // Store establishmentId in localStorage if it's available in currentUser
      if (currentUser.establishmentId) {
        localStorage.setItem('establishmentId', currentUser.establishmentId);
        setEstablishmentId(currentUser.establishmentId);
      } else {
        localStorage.removeItem('establishmentId');
        setEstablishmentId(null);
      }

      // NEW: Store deviceId in localStorage if it's available in currentUser
      if (currentUser.deviceId) {
        localStorage.setItem('deviceId', currentUser.deviceId); // Store deviceId separately
        setDeviceId(currentUser.deviceId);
      } else {
        localStorage.removeItem('deviceId');
        setDeviceId(null);
      }

    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('token'); // Ensure token is also removed on logout
      localStorage.removeItem('establishmentId'); // Clear establishmentId on logout
      localStorage.removeItem('deviceId'); // NEW: Clear deviceId on logout

      setUserRole(null);
      setEstablishmentId(null);
      setDeviceId(null); // NEW: Clear deviceId on logout
    }
  }, [currentUser]); // Trigger this effect when currentUser changes

  // Function to handle user login
  const login = (userData, token) => {
    setCurrentUser(userData);
    localStorage.setItem('token', token);

    if (userData && userData.role) {
      localStorage.setItem('userRole', userData.role);
      setUserRole(userData.role);
    }

    // Set establishmentId if provided in userData
    if (userData && userData.establishmentId) {
      localStorage.setItem('establishmentId', userData.establishmentId);
      setEstablishmentId(userData.establishmentId);
    } else {
      localStorage.removeItem('establishmentId');
      setEstablishmentId(null);
    }

    // NEW: Set deviceId here if provided in userData
    if (userData && userData.deviceId) {
      localStorage.setItem('deviceId', userData.deviceId); // Store deviceId separately
      setDeviceId(userData.deviceId);
    } else {
      localStorage.removeItem('deviceId');
      setDeviceId(null);
    }
  };

  // Function to handle user logout
  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setEstablishmentId(null);
    setDeviceId(null); // NEW: Clear deviceId on logout
    localStorage.clear(); // Consider clearing all relevant localStorage items for simplicity on logout
  };

  // Function to get the JWT
  const getToken = () => {
    return localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, establishmentId, deviceId, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
