import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';

import HomeNav from './component/Navbar/homeNav.jsx';
import HomePage from './component/pages/HomePage.jsx';
import AboutPage from './component/pages/AboutPage.jsx';
import ContactPage from './component/pages/ContactPage.jsx';
import LoginPage from './component/pages/LoginPage.jsx';
import CollectionPage from './component/pages/CollectionPage.jsx';
import EventPage from './component/pages/EventPage.jsx';
import RegisterPage from "./component/pages/RegisterPage.jsx";
import ClientHomePage from './component/pages/Client/ClientHomePage.jsx';
import StylistHomePage from './component/pages/Stylist/StylistHomePage.jsx';
import AdminHomePage from './component/pages/Admin/AdminHomePage.jsx';
import ClientProfilePage from './component/pages/Client/ClientProfilePage.jsx';

import './App.css'
// --- Axios Configuration ---
axios.defaults.withCredentials = true;
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

api.interceptors.request.use(
  config => {
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }
    return config;
  },
  error => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);
// --- End Axios Configuration ---


function App() {
  const navigate = useNavigate();

  const [auth, setAuth] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  // Add registerForm state
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: 'client', // Default to client
    country: '', city: '', body_type: '', colors: '' // Client-specific fields
  });

  // Edit form state - Initialized with default values
  const [editForm, setEditForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    country: '', city: '', body_type: '', colors: '', message_to_stylist: ''
  });

  // Helper to parse validation errors
  const formatValidationErrors = (errors) => {
    let errorMessage = 'Validation failed: ';
    for (const field in errors) {
      errorMessage += `${field}: ${errors[field].join(', ')} `;
    }
    return errorMessage;
  };

  // Fetch currently authenticated user's details and their specific profile
  const fetchAuthenticatedUser = async () => {
    try {
      await api.get('/sanctum/csrf-cookie'); // Ensure CSRF cookie is fresh
      const res = await api.get('/api/user');
      setAuth(res.data); // res.data is the user object from Laravel

      // Safely access the client profile if it exists
      const clientProfileData = res.data.client; // <-- Access directly from res.data.client

      // Populate edit form with current user data
      setEditForm({
        name: res.data.name,
        email: res.data.email,
        password: '', // Never pre-fill passwords
        password_confirmation: '',
        // Client specific fields for edit form, accessed from clientProfileData
        country: res.data.role === 'client' && clientProfileData ? clientProfileData.country || '' : '',
        city: res.data.role === 'client' && clientProfileData ? clientProfileData.city || '' : '',
        body_type: res.data.role === 'client' && clientProfileData ? clientProfileData.body_type || '' : '',
        message_to_stylist: res.data.role === 'client' && clientProfileData ? clientProfileData.message_to_stylist || '' : '',
        // Convert array from backend to comma-separated string for input display
        colors: res.data.role === 'client' && clientProfileData && Array.isArray(clientProfileData.colors)
          ? clientProfileData.colors.join(', ')
          : '',
      });
      setError(''); // Clear any previous errors on successful fetch
    } catch (err) {
      console.log("No authenticated user found or session expired.", err);
      setAuth(null);
      // Clear states related to authenticated user data
      // No need to clear users, myClients, availableStylists here,
      // as they are handled by the useEffect dependent on 'auth'.
    }
  };

  // Registration handler
  const handleRegister = async () => {
    try {
      await api.get('/sanctum/csrf-cookie');

      const dataToSend = {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        password_confirmation: registerForm.password_confirmation,
        role: registerForm.role,
      };

      // Add client-specific fields if role is client
      if (registerForm.role === 'client') {
        dataToSend.country = registerForm.country;
        dataToSend.city = registerForm.city;
        dataToSend.body_type = registerForm.body_type;

        // Convert comma-separated string to JSON string for the backend
        const colorsArray = registerForm.colors
          ? registerForm.colors.split(',').map(color => color.trim()).filter(color => color !== '')
          : [];
        dataToSend.colors = JSON.stringify(colorsArray);
      }

      const res = await api.post('/api/register', dataToSend);
      setAuth(res.data.user);
      setSuccess('Registration successful!'); // Set success message
      setError('');
      // Reset form after successful registration
      setRegisterForm({ name: '', email: '', password: '', password_confirmation: '', role: 'client', country: '', city: '', body_type: '', colors: '' });

      // Navigate to relevant dashboard after registration
      if (res.data.user.role === 'client') {
        navigate('/client-dashboard');
      } else if (res.data.user.role === 'stylist') {
        navigate('/stylist-dashboard');
      } else {
        navigate('/'); // Default fallback
      }
      return true;
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.status === 422) {
        setError(formatValidationErrors(err.response.data.errors));
      } else {
        setError('Registration failed. Please check your input.');
      }
      setSuccess('');
      return false;
    }
  };

  // Login handler
  const handleLogin = async () => {
    try {
      await api.get('/sanctum/csrf-cookie');
      const res = await api.post('/api/login', {
        email: loginForm.email,
        password: loginForm.password,
      });
      setAuth(res.data.user);
      setError('');
      setSuccess('Login successful!');
      setLoginForm({ email: '', password: '' }); // Clear form

      if (res.data.user.role === 'client') {
        navigate('/client-dashboard');
      } else if (res.data.user.role === 'stylist') {
        navigate('/stylist-dashboard');
      } else if (res.data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }
      return true;
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.status === 401) {
        setError('Login failed: Invalid credentials.');
      } else if (err.response && err.response.status === 422) {
        setError(formatValidationErrors(err.response.data.errors));
      } else {
        setError('Login failed. Please try again.');
      }
      setSuccess('');
      return false;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      setAuth(null);
      setError('');
      setSuccess('Logged out successfully.');
      navigate('/'); // Redirect to home or login page
    } catch (err) {
      console.error("Logout error:", err);
      setError('Logout failed.');
      setSuccess('');
    }
  };

  // Update profile handler
  const handleUpdateProfile = async () => {
    try {
      await api.get('/sanctum/csrf-cookie'); // Always get CSRF cookie

      const userDataToUpdate = {};
      const profileDataToUpdate = {};

      // 1. Determine which user core fields are being updated
      if (editForm.name !== auth.name) userDataToUpdate.name = editForm.name;
      if (editForm.email !== auth.email) userDataToUpdate.email = editForm.email;
      if (editForm.password) {
        userDataToUpdate.password = editForm.password;
        userDataToUpdate.password_confirmation = editForm.password_confirmation;
      }

      // 2. Determine which role-specific profile fields are being updated
      // Access auth.client (or auth.stylist) directly
      if (auth.role === 'client' && auth.client) {
        if (editForm.country !== auth.client.country) profileDataToUpdate.country = editForm.country;
        if (editForm.city !== auth.client.city) profileDataToUpdate.city = editForm.city;
        if (editForm.body_type !== auth.client.body_type) profileDataToUpdate.body_type = editForm.body_type;
        // Handle colors conversion for update
        const currentClientColorsString = Array.isArray(auth.client.colors) ? auth.client.colors.join(', ') : auth.client.colors;
        if (editForm.colors !== currentClientColorsString) {
          const colorsArray = editForm.colors
            ? editForm.colors.split(',').map(color => color.trim()).filter(color => color !== '')
            : [];
          profileDataToUpdate.colors = JSON.stringify(colorsArray); // Send as JSON string to backend
        }
        if (editForm.message_to_stylist !== auth.client.message_to_stylist) {
          profileDataToUpdate.message_to_stylist = editForm.message_to_stylist;
        }
      }
      // Add logic for stylist profile updates here if needed
      // else if (auth.role === 'stylist' && auth.stylist) { ... }


      let userUpdateSuccess = true;
      let profileUpdateSuccess = true;

      // Send request for user core fields if there's anything to update
      if (Object.keys(userDataToUpdate).length > 0) {
        try {
          await api.put('/api/user', userDataToUpdate);
          setSuccess('User core profile updated successfully.');
          setError('');
        } catch (userErr) {
          console.error('Error updating user core profile:', userErr);
          userUpdateSuccess = false;
          setError(userErr.response?.data?.message || 'Failed to update user core profile.');
        }
      }

      // Send request for role-specific profile fields if there's anything to update
      // Only attempt if user core update was successful OR if there was no user core update needed
      if (Object.keys(profileDataToUpdate).length > 0 && userUpdateSuccess) {
        try {
          let profileEndpoint = '';
          if (auth.role === 'client') {
            profileEndpoint = '/api/client/profile';
          } else if (auth.role === 'stylist') {
            profileEndpoint = '/api/stylist/profile';
          }

          if (profileEndpoint) {
            await api.put(profileEndpoint, profileDataToUpdate);
            setSuccess(prev => prev ? prev + ' Role-specific profile updated.' : 'Role-specific profile updated successfully.');
            setError('');
          }
        } catch (profileErr) {
          console.error('Error updating role-specific profile:', profileErr);
          profileUpdateSuccess = false;
          setError(profileErr.response?.data?.message || 'Failed to update role-specific profile.');
        }
      }

      if (userUpdateSuccess && profileUpdateSuccess) {
        await fetchAuthenticatedUser(); // Re-fetch the entire authenticated user and profile to get latest data
        setIsEditing(false); // Exit edit mode
        setSuccess('Profile updated successfully!'); // Final success message
      } else if (!userUpdateSuccess || !profileUpdateSuccess) {
        // If an error occurred, the error state should already be set by the individual try/catch blocks
        setSuccess(''); // Clear success if there was any error
      }
    } catch (err) {
      // This catch block handles errors from csrf-cookie or general unexpected errors
      console.error('Error during profile update process:', err);
      setError(err.response?.data?.message || 'An unexpected error occurred during profile update.');
      setSuccess('');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    // IMPORTANT: Replace window.confirm with a custom modal UI
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await api.get('/sanctum/csrf-cookie');
        await api.delete('/api/user');
        setAuth(null);
        setError('');
        setSuccess('Account deleted successfully.');
        navigate('/'); // Redirect after deletion
      } catch (err) {
        console.error("Account deletion error:", err);
        setError('Account deletion failed. Please try again.');
        setSuccess('');
      }
    }
  };

  // Initial authentication check on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await api.get('/sanctum/csrf-cookie');
        await fetchAuthenticatedUser();
      } catch (err) {
        console.log("Initial auth check: Not authenticated or session expired.");
        setAuth(null); // Ensure auth is null if no user is found
      }
    };
    checkAuthStatus();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch data based on authentication state and role
  useEffect(() => {
    if (auth) {
      // No need to fetch all users here unless it's for a specific admin view
      // fetchUsers(); // This might be for a dedicated admin page, not general App usage
      if (auth.role === 'stylist') {
        // fetchMyClients(); // Fetch clients for stylist (if StylistHomePage needs it)
      } else if (auth.role === 'client') {
        // fetchStylists(); // Fetch stylists for client to choose from (if ClientHomePage needs it)
      }
    }
    // No need for else block here, as auth state change will trigger re-render
  }, [auth]); // Reruns when auth state changes

  return (
    <>
      <video autoPlay muted loop playsInline id="bg-video">
        <source src="/Background/rise.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <HomeNav auth={auth} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/login"
          element={<LoginPage
            handleLogin={handleLogin}
            email={loginForm.email}
            password={loginForm.password}
            setEmail={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            setPassword={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
          />}
        />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/event" element={<EventPage />} />
        {/* Pass registration props to RegisterPage */}
        <Route
          path="/register"
          element={<RegisterPage
            handleRegister={handleRegister}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
          />}
        />

        {/* Protected Routes for Dashboards */}
         {auth && auth.role === 'client' && (
          <>
            <Route path="/client-dashboard" element={<ClientHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} />} />
            {/* Pass new props to ClientProfilePage */}
            <Route
              path="/client-profile"
              element={<ClientProfilePage
                auth={auth}
                editForm={editForm}
                setEditForm={setEditForm}
                handleUpdateProfile={handleUpdateProfile} // Pass the update function
                error={error} // Pass error state
                setError={setError} // Pass error setter
                success={success} // Pass success state
                setSuccess={setSuccess} // Pass success setter
                fetchAuthenticatedUser={fetchAuthenticatedUser} // Pass fetch function to re-fetch after update
              />}
            />
            <Route path="/ask-stylist" element={<div>Ask a Stylist Page - Coming Soon!</div>} />
            <Route path="/ask-ai" element={<div>Ask an AI Page - Coming Soon!</div>} />
          </>
        )}
        {auth && auth.role === 'stylist' && (
          <Route path="/stylist-dashboard" element={<StylistHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} />} />
        )}
        {auth && auth.role === 'admin' && (
          <Route path="/admin-dashboard" element={<AdminHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} />} />
        )}

        {/* Redirect messages for unauthenticated/unauthorized access */}
        <Route
          path="/client-dashboard"
          element={!auth || auth.role !== 'client' ? <div className="text-center p-8 text-red-600">Please log in as a client to view this page.</div> : null}
        />
        <Route
          path="/client-profile"
          element={!auth || auth.role !== 'client' ? <div className="text-center p-8 text-red-600">Please log in as a client to view your profile.</div> : null}
        />
        <Route
          path="/stylist-dashboard"
          element={!auth || auth.role !== 'stylist' ? <div className="text-center p-8 text-red-600">Please log in as a stylist to view this page.</div> : null}
        />
        <Route
          path="/admin-dashboard"
          element={!auth || auth.role !== 'admin' ? <div className="text-center p-8 text-red-600">Please log in as an admin to view this page.</div> : null}
        />
        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<h2 className="text-center p-8 text-red-600">404 - Page Not Found</h2>} />
      </Routes>
    </>
  );
}

export default App;