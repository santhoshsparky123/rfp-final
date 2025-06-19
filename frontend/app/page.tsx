// frontend/app/page.tsx
"use client"

import { useState, useEffect } from 'react';
import EmployeeDashboard from "@/components/employee-dashboard";
import Login from "@/components/login";
import SuperAdminDashboard from "@/components/super-admin-dashboard";
import AdminDashboard from "@/components/admin-dashboard";
import UserDashboard from "@/components/user-dashboard";

interface User {
  id: string; // Ensure ID is always a string
  email: string;
  // This role type should match the roles returned by your backend's authentication.
  // Based on authendication.py, roles can be "super_admin", "admin", "employee", "user".
  role: "employee" | "admin" | "super_admin" | "user";
  name: string;
  company?: string;
}

export default function RFPProcessingApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // To ensure localStorage operations run client-side

  useEffect(() => {
    setIsClient(true); // Mark as client-side once mounted

    // Attempt to load token and user from localStorage on initial render
    const storedAuthToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedAuthToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Ensure user ID is string after parsing from localStorage
        parsedUser.id = String(parsedUser.id);
        setAuthToken(storedAuthToken);
        setUser(parsedUser);
        console.log("App/page.tsx: Loaded token and user from localStorage on mount.");
      } catch (e) {
        console.error("App/page.tsx: Failed to parse stored user or token from localStorage:", e);
        handleLogout(); // Clear invalid data if parsing fails
      }
    } else {
        console.log("App/page.tsx: No token or user found in localStorage on mount.");
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleLoginSuccess = (loggedInUser: User) => {
    // This callback is triggered by login.tsx after successful authentication.
    // login.tsx should have already stored the token in localStorage.
    const tokenFromLocalStorage = localStorage.getItem('token');
    if (tokenFromLocalStorage) {
      setAuthToken(tokenFromLocalStorage);
      // Ensure the ID is a string before setting in state and storing
      loggedInUser.id = String(loggedInUser.id);
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser)); // Store full user object
      console.log("App/page.tsx: Login success handled. Token and user set in state and localStorage.");
    } else {
      console.error("App/page.tsx: Login successful but token not found in localStorage immediately after login. This is unexpected.");
      handleLogout(); // Force logout if token is missing after successful login
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('token'); // Clear token from localStorage
    localStorage.removeItem('user'); // Clear user from localStorage
    console.log("App/page.tsx: User logged out, token and user removed from localStorage.");
  };

  // Render nothing or a loading spinner until client-side operations (localStorage) are done
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading application...</p>
      </div>
    );
  }

  // Conditional rendering: Show dashboard if authenticated, otherwise show login
  // Ensure both 'user' and 'authToken' are present before attempting to route
  if (user && authToken !== null) {
    switch (user.role) {
      case "super_admin":
        return <SuperAdminDashboard user={user} onLogout={handleLogout} token={authToken} />;
      case "admin":
        return <AdminDashboard user={user} onLogout={handleLogout} token={authToken} />;
      case "employee":
        return <EmployeeDashboard user={user} onLogout={handleLogout} token={authToken} />;
      case "user":
        return <UserDashboard user={user} onLogout={handleLogout} token={authToken} />;
      default:
        // Fallback for an unrecognized role - log error and provide logout option
        console.error("App/page.tsx: Unrecognized user role:", user.role);
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p>Error: Unrecognized user role. Please log in again.</p>
            <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Logout</button>
          </div>
        );
    }
  }

  // If not authenticated (user or authToken is null), render the Login component
  return (
    // Pass the handleLoginSuccess callback to your Login component
    <Login onLogin={handleLoginSuccess} />
  );
}