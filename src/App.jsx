import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';

import HomeNav from "./component/Navbar/homeNav.jsx";
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


  const formatValidationErrors = (errors) => {
    let errorMessage = 'Validation failed: ';
    for (const field in errors) {
      errorMessage += `${field}: ${errors[field].join(', ')} `;
    }
    return errorMessage;
  };

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
      setLoginForm({ email: '', password: '' });

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

  // Add handleRegister function
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
      setError('');
      setSuccess('Registration successful!');
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


  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      setAuth(null);
      setError('');
      setSuccess('Logged out successfully.');
      navigate('/');
    } catch (err) {
      console.error("Logout error:", err);
      setError('Logout failed.');
      setSuccess('');
    }
  };

  useEffect(() => {
    const fetchAuthenticatedUser = async () => {
      try {
        await api.get('/sanctum/csrf-cookie');
        const res = await api.get('/api/user');
        setAuth(res.data);
        setError('');
      } catch (err) {
        console.log("No authenticated user found or session expired.");
        setAuth(null);
      }
    };
    fetchAuthenticatedUser();
  }, []);

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
          <Route path="/client-dashboard" element={<ClientHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} />} />
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