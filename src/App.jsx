
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
    // console.log('Sending request to:', config.url); // Uncomment for debugging
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }
    // console.log('Request Headers (after interceptor):', config.headers); // Uncomment for debugging
    return config;
  },
  error => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);
// --- End Axios Configuration ---


function App() {
  const navigate = useNavigate(); // Now this will work!

  // --- Authentication and User State Management ---
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

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

      <HomeNav auth={auth} /> {/* Pass auth prop to HomeNav if you want to show/hide links */}
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
        <Route path="/register" element={<RegisterPage />} />

        {auth && auth.role === 'client' && (
          <Route path="/client-dashboard" element={<ClientHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} />} />
        )}
        {/* You'll need routes for stylist and admin dashboards later */}
         <Route
          path="/client-dashboard"
          element={!auth || auth.role !== 'client' ? <div className="text-center p-8 text-red-600">Please log in as a client to view this page.</div> : null}
        />
        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<h2 className="text-center p-8 text-red-600">404 - Page Not Found</h2>} />
      </Routes>
    </>
  );
}

export default App;