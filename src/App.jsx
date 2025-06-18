// App.jsx
// AI prompt: how to set up Axios, how to set up firebase
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

// Import AuthContext
import { AuthContext } from './AuthContext'; 

// Import Firebase Storage functions and the storage instance from your config file
import { ref, uploadBytesResumable } from 'firebase/storage'; // Now importing uploadBytesResumable
import { storage } from './firebase.js'; // Import the initialized storage instance

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
import AskAStylistPage from './component/pages/Client/AskStylistPage.jsx';
import ClientList from './component/pages/Stylist/ClientList.jsx';
import ClientDetail from './component/pages/Stylist/ClientDetail.jsx';
import AllClientList from './component/pages/Admin/AllClientList.jsx';
import AllStylistList from './component/pages/Admin/AllStylistList.jsx';
import AdminClientDetail from './component/pages/Admin/AdminClientDetail.jsx';
import AdminStylistDetail from './component/pages/Admin/AdminStylistDetail.jsx';
import ClientEventPage from './component/pages/Client/ClientEventPage.jsx';
import ClientAskAIPage from './component/pages/Client/ClientAskAIPage.jsx';

import './App.css'

// --- Axios Configuration ---

// Create Axios instance
const api = axios.create({
  // baseURL: 'http://localhost:8000',
  baseURL: 'https://aliceblue-wolverine-462272.hostingersite.com',
  // enable withCredentials so cookies (including XSRF-TOKEN) are sent automatically
  withCredentials: true,
});

// Helper function to get a specific cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Set up the request interceptor
// This interceptor will read the XSRF-TOKEN cookie and set it as a header
// for methods that require CSRF protection (POST, PUT, PATCH, DELETE).
// GET requests generally do not need the X-XSRF-TOKEN header.
api.interceptors.request.use(
  config => {
    // Only add the X-XSRF-TOKEN header for methods that modify data
    const methodsRequiringCsrf = ['post', 'put', 'patch', 'delete'];
    if (methodsRequiringCsrf.includes(config.method.toLowerCase())) {
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken) {
        // Decode the token if it's URL-encoded (common with Laravel Sanctum)
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
      }
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
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: 'client', 
    country: '', city: '', body_type: '', colors: '' // Client-specific fields
  });

  const [editForm, setEditForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    country: '', city: '', body_type: '', colors: '', message_to_stylist: '',
    stylist_id: '',
  });

  const [users, setUsers] = useState([]); 
  const [myClients, setMyClients] = useState([]);
  const [availableStylists, setAvailableStylists] = useState([]);

  // ADMIN STATES
  const [allClients, setAllClients] = useState([]);
  const [allStylists, setAllStylists] = useState([]);


  const formatValidationErrors = (errors) => {
    let errorMessage = 'Validation failed: ';
    for (const field in errors) {
      errorMessage += `${field}: ${errors[field].join(', ')} `;
    }
    return errorMessage;
  };

  const fetchAuthenticatedUser = useCallback(async () => {
    try {
      const res = await api.get('/api/user');
      setAuth(res.data);

      const clientProfileData = res.data.client;

      // Initialize editForm with data from the authenticated user
      setEditForm({
        name: res.data.name || '',
        email: res.data.email || '',
        password: '', 
        password_confirmation: '',
        country: res.data.role === 'client' && clientProfileData ? clientProfileData.country || '' : '',
        city: res.data.role === 'client' && clientProfileData ? clientProfileData.city || '' : '',
        body_type: res.data.role === 'client' && clientProfileData ? clientProfileData.body_type || '' : '',
        message_to_stylist: res.data.role === 'client' && clientProfileData ? clientProfileData.message_to_stylist || '' : '',
        // Ensure colors is parsed if it's a JSON string, then joined for the editForm
        colors: res.data.role === 'client' && clientProfileData && clientProfileData.colors
          ? (Array.isArray(clientProfileData.colors) 
              ? clientProfileData.colors.join(', ') // If already array, join
              : JSON.parse(clientProfileData.colors).join(', ')) // If JSON string, parse then join
          : '',
        stylist_id: res.data.role === 'client' && clientProfileData ? clientProfileData.stylist_id || '' : '',
      });
      setError('');
    } catch (err) {
      console.log("No authenticated user found or session expired.", err);
      setAuth(null);
    }
  }, [setAuth, setEditForm, setError]);


  const fetchStylists = useCallback(async () => {
    try {
      const res = await api.get('/api/stylists');
      if (res.data && Array.isArray(res.data.stylists)) {
        setAvailableStylists(res.data.stylists);
      } else {
        console.warn("API response for /api/stylists was not an array in 'stylists' key:", res.data);
        setAvailableStylists([]);
      }
      setError('');
    } catch (err) {
      console.error("Error fetching stylists:", err);
      setError('Failed to fetch stylists.');
      setAvailableStylists([]);
    }
  }, [setAvailableStylists, setError]);

  const fetchMyClients = useCallback(async () => {
    try {
      const res = await api.get('/api/stylist/clients');
      setMyClients(res.data.clients);
      setError('');
    } catch (err) {
      console.error("Error fetching stylist's clients:", err);
      if (err.response && err.response.status === 403) {
        setError('You are not authorized to view this. Only stylists can.');
      } else {
        setError("Failed to fetch stylist's clients.");
      }
      setMyClients([]); // Clear clients on error
    }
  }, [setMyClients, setError]);


  // NEW ADMIN FUNCTIONS

  const fetchAllClients = useCallback(async () => {
    if (auth && auth.role === 'admin') {
      try {
        const res = await api.get('/api/admin/clients');
        setAllClients(res.data.clients);
        setError('');
      } catch (err) {
        console.error("Error fetching all clients:", err);
        setError(err.response?.data?.message || 'Failed to fetch all clients.');
        setAllClients([]);
      }
    }
  }, [auth, setAllClients, setError]);

  const fetchAllStylists = useCallback(async () => {
    if (auth && auth.role === 'admin') {
      try {
        const res = await api.get('/api/admin/stylists');
        setAllStylists(res.data.stylists);
        setError('');
      } catch (err) {
        console.error("Error fetching all stylists:", err);
        setError(err.response?.data?.message || 'Failed to fetch all stylists.');
        setAllStylists([]);
      }
    }
  }, [auth, setAllStylists, setError]);


  const handleAdminEditClient = async (clientId, formData) => {
    try {
      const res = await api.put(`/api/admin/clients/${clientId}`, formData);
      setSuccess(res.data.message || 'Client updated successfully!');
      setError('');
      fetchAllClients(); 
      return true;
    } catch (err) {
      console.error("Error updating client:", err);
      setError(err.response?.data?.message || 'Failed to update client.');
      setSuccess('');
      return false;
    }
  };

  const handleAdminDeleteClient = async (clientId) => {
    // Implement a confirmation dialog in the component calling this function
    try {
      const res = await api.delete(`/api/admin/clients/${clientId}`);
      setSuccess(res.data.message || 'Client deleted successfully!');
      setError('');
      fetchAllClients(); 
      return true;
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(err.response?.data?.message || 'Failed to delete client.');
      setSuccess('');
      return false;
    }
  };

  const handleAdminEditStylist = async (stylistId, formData) => {
    try {
      const res = await api.put(`/api/admin/stylists/${stylistId}`, formData);
      setSuccess(res.data.message || 'Stylist updated successfully!');
      setError('');
      fetchAllStylists(); 
      return true;
      } catch (err) {
      console.error("Error updating stylist:", err);
      setError(err.response?.data?.message || 'Failed to update stylist.');
      setSuccess('');
      return false;
    }
  };

  const handleAdminDeleteStylist = async (stylistId) => {
    // Implement a confirmation dialog in the component calling this function
    try {
      const res = await api.delete(`/api/admin/stylists/${stylistId}`);
      setSuccess(res.data.message || 'Stylist deleted successfully!');
      setError('');
      fetchAllStylists(); 
      return true;
    } catch (err) {
      console.error("Error deleting stylist:", err);
      setError(err.response?.data?.message || 'Failed to delete stylist.');
      setSuccess('');
      return false;
    }
  };

  // END NEW ADMIN FUNCTIONS


  const handleRegister = async () => {
    try {
      // Call csrf-cookie endpoint first to ensure the XSRF-TOKEN cookie is set
      await api.get('/sanctum/csrf-cookie');

      const dataToSend = {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        password_confirmation: registerForm.password_confirmation,
        role: registerForm.role,
      };

      if (registerForm.role === 'client') {
        dataToSend.country = registerForm.country;
        dataToSend.city = registerForm.city;
        dataToSend.body_type = registerForm.body_type;

        const colorsArray = registerForm.colors
          ? registerForm.colors.split(',').map(color => color.trim()).filter(color => color !== '')
          : [];
        dataToSend.colors = JSON.stringify(colorsArray);
      }

      const res = await api.post('/api/register', dataToSend);
      setAuth(res.data.user);
      setError('');
      setRegisterForm({ name: '', email: '', password: '', password_confirmation: '', role: 'client', country: '', city: '', body_type: '', colors: '' });

      // --- Firebase Storage: Create client folder on successful registration ---
      if (res.data.user.role === 'client' && res.data.user.email) {
        try {
          const clientEmail = res.data.user.email;
          
          const folderPath = `clients/${clientEmail}/.keep`; 
          const storageRef = ref(storage, folderPath);
          const emptyBlob = new Blob([], { type: 'text/plain' }); 

          // Use uploadBytesResumable, as it's exported by your firebaseConfig.js
          const uploadTask = uploadBytesResumable(storageRef, emptyBlob);
          // Await the task completion to ensure the file is uploaded before proceeding
          await uploadTask;
          
          console.log(`Firebase folder 'clients/${clientEmail}' created (by uploading .keep file).`);
          setSuccess('Registration successful and profile folder created!');
        } catch (firebaseErr) {
          console.error("Firebase folder creation failed:", firebaseErr);
          
          setSuccess('Registration successful, but profile folder creation failed. Please contact support if issues arise.');
        }
      } else {
        setSuccess('Registration successful!'); // For non-client roles or if email is missing
      }
      // --- End Firebase Storage Logic ---

        if (res.data.user.role === 'client') {
        navigate('/');
      } else if (res.data.user.role === 'stylist') {
        navigate('/');
      } else {
        navigate('/');
      }
      
      window.location.reload();
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

  const handleLogin = async () => {
    try {
      // Call csrf-cookie endpoint first to ensure the XSRF-TOKEN cookie is set
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

  const handleLogout = async () => {
    try {
      // Call csrf-cookie endpoint first to ensure the XSRF-TOKEN cookie is set
      await api.get('/sanctum/csrf-cookie'); 
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

  const handleClientStylistAndMessageUpdate = useCallback(async (stylistId, message) => {
    try {
      // Call csrf-cookie endpoint first to ensure the XSRF-TOKEN cookie is set
      await api.get('/sanctum/csrf-cookie');

      let stylistUpdateSuccess = false;
      let messageUpdateSuccess = false;

      if (stylistId !== (auth?.client?.stylist_id || '')) {
        try {
          const stylistRes = await api.post('/api/client/choose-stylist', { stylist_id: stylistId });
          console.log('Stylist ID update response:', stylistRes.data.message);
          stylistUpdateSuccess = true;
        } catch (stylistErr) {
          console.error('Error updating stylist ID:', stylistErr);
          setError(stylistErr.response?.data?.message || 'Failed to update stylist.');
        }
      } else {
        stylistUpdateSuccess = true;
      }

      if (message !== (auth?.client?.message_to_stylist || '')) {
        try {
          const messageRes = await api.put('/api/client/profile', { message_to_stylist: message });
          console.log('Message to stylist update response:', messageRes.data.message);
          messageUpdateSuccess = true;
        } catch (messageErr) {
          console.error('Error updating message to stylist:', messageErr);
          setError(messageErr.response?.data?.message || 'Failed to update message.');
        }
      } else {
        messageUpdateSuccess = true;
      }

      if (stylistUpdateSuccess && messageUpdateSuccess) {
        await fetchAuthenticatedUser();
        setSuccess('Stylist and message updated successfully!');
        return true;
      } else {
        setSuccess('');
        return false;
      }
    } catch (err) {
      console.error('An unexpected error occurred during stylist/message update:', err);
      setError(err.response?.data?.message || 'An unexpected error occurred.');
      setSuccess('');
      return false;
    }
  }, [auth, fetchAuthenticatedUser, setError, setSuccess]);


  const handleUpdateProfile = useCallback(async (specificFormData = null) => {
    try {
      // Call csrf-cookie endpoint first to ensure the XSRF-TOKEN cookie is set
      await api.get('/sanctum/csrf-cookie');

      // Determine the data to send based on whether specificFormData is provided
      // This allows calling updateClientProfile directly with specific fields (like colors)
      const dataToProcess = specificFormData || editForm;

      const userDataToUpdate = {};
      const profileDataToUpdate = {};

      // General user data updates
      if (dataToProcess.name !== auth.name) userDataToUpdate.name = dataToProcess.name;
      if (dataToProcess.email !== auth.email) userDataToUpdate.email = dataToProcess.email;
      if (dataToProcess.password) {
        userDataToUpdate.password = dataToProcess.password;
        userDataToUpdate.password_confirmation = dataToProcess.password_confirmation;
      }

      // Client-specific profile data updates
      if (auth.role === 'client' && auth.client) {
        if (dataToProcess.country !== auth.client.country) profileDataToUpdate.country = dataToProcess.country;
        if (dataToProcess.city !== auth.client.city) profileDataToUpdate.city = dataToProcess.city;
        if (dataToProcess.body_type !== auth.client.body_type) profileDataToUpdate.body_type = dataToProcess.body_type;

        // --- Handle colors array for profile update ---
        // auth.client.colors can be Array or JSON string from backend
        const currentColorsFromAuth = Array.isArray(auth.client.colors) 
          ? auth.client.colors 
          : (auth.client.colors ? JSON.parse(auth.client.colors) : []);
        
        // dataToProcess.colors can be Array (from ClientAskAIPage) or comma-separated string (from ClientProfilePage editForm)
        let newColorsArray = [];
        if (Array.isArray(dataToProcess.colors)) {
          newColorsArray = dataToProcess.colors;
        } else if (typeof dataToProcess.colors === 'string' && dataToProcess.colors.trim() !== '') {
          newColorsArray = dataToProcess.colors.split(',').map(color => color.trim()).filter(Boolean);
        }
        
        // Only update if the array content has changed
        if (JSON.stringify(newColorsArray.sort()) !== JSON.stringify(currentColorsFromAuth.sort())) { // Sort for consistent comparison
          profileDataToUpdate.colors = JSON.stringify(newColorsArray); // Send as JSON string to backend
        }
      }

      let userUpdateSuccess = true;
      let profileUpdateSuccess = true;

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

      if (Object.keys(profileDataToUpdate).length > 0) { // Removed '&& userUpdateSuccess' here to allow profile update even if user update failed (though typically you'd want both to succeed)
        try {
          let profileEndpoint = '';
          if (auth.role === 'client') {
            profileEndpoint = '/api/client/profile';
          } else if (auth.role === 'stylist') {
            profileEndpoint = '/api/stylist/profile';
          }

          if (profileEndpoint) {
            await api.put(profileEndpoint, profileDataToUpdate);
            if (Object.keys(userDataToUpdate).length === 0) { // Only set success if only profile was updated
              setSuccess('Role-specific profile updated successfully!');
              setError('');
            }
          }
        } catch (profileErr) {
          console.error('Error updating role-specific profile:', profileErr);
          profileUpdateSuccess = false;
          setError(profileErr.response?.data?.message || 'Failed to update role-specific profile.');
        }
      } else {
        if (Object.keys(userDataToUpdate).length === 0) { // No updates were needed
          setSuccess('No changes to save.');
          setError('');
        }
      }

      // Always fetch authenticated user to refresh the auth state after any potential update
      if (userUpdateSuccess || profileUpdateSuccess) {
        await fetchAuthenticatedUser();
      }

      return userUpdateSuccess && profileUpdateSuccess;
    } catch (err) {
      console.error('Error during profile update process:', err);
      setError(err.response?.data?.message || 'An unexpected error occurred during profile update.');
      setSuccess('');
      return false;
    }
  }, [auth, editForm, fetchAuthenticatedUser, setError, setSuccess]);


  const handleDeleteAccount = async () => {
    console.log("Showing custom confirmation for account deletion.");
    try {
      // Call csrf-cookie endpoint first to ensure the XSRF-TOKEN cookie is set
      await api.get('/sanctum/csrf-cookie');
      await api.delete('/api/user');
      setAuth(null);
      setError('');
      setSuccess('Account deleted successfully.');
      navigate('/');
    } catch (err) {
      console.error("Account deletion error:", err);
      setError('Account deletion failed. Please try again.');
      setSuccess('');
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await fetchAuthenticatedUser();
      } catch (err) {
        console.log("Initial auth check: Not authenticated or session expired.");
        setAuth(null);
      }
    };
    checkAuthStatus();
  }, [fetchAuthenticatedUser]);

  useEffect(() => {
    if (auth) {
      if (auth.role === 'client') {
        fetchStylists();
      } else if (auth.role === 'stylist') {
        fetchMyClients();
      } else if (auth.role === 'admin') { 
        fetchAllClients();
        fetchAllStylists();
      }
    } else {
      setUsers([]);
      setMyClients([]);
      setAvailableStylists([]);
      setAllClients([]); // Clear admin lists on logout
      setAllStylists([]); // Clear admin lists on logout
    }
  }, [auth, fetchStylists, fetchMyClients, fetchAllClients, fetchAllStylists]);


  return (
    <>
      <video autoPlay muted loop playsInline id="bg-video">
        <source src="/Background/rise.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <HomeNav auth={auth} handleLogout={handleLogout} />
      {/* Wrap your Routes with AuthContext.Provider */}
      <AuthContext.Provider value={{ 
        auth, 
        updateClientProfile: handleUpdateProfile, // Expose handleUpdateProfile for ClientAskAIPage
        setError, 
        setSuccess,
        fetchAuthenticatedUser // Also useful for components to manually refresh auth
      }}>
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

          {auth && auth.role === 'client' && (
            <>
              <Route path="/client-dashboard" element={<ClientHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} />} />
              <Route
                path="/client-profile"
                element={<ClientProfilePage
                  auth={auth}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  handleUpdateProfile={handleUpdateProfile}
                  error={error}
                  setError={setError}
                  success={success}
                  setSuccess={setSuccess}
                  fetchAuthenticatedUser={fetchAuthenticatedUser}
                  availableStylists={availableStylists}
                />}
              />
              <Route
                path="/ask-stylist"
                element={<AskAStylistPage
                  auth={auth}
                  error={error}
                  setError={setError}
                  success={success}
                  setSuccess={setSuccess}
                  fetchAuthenticatedUser={fetchAuthenticatedUser}
                  availableStylists={availableStylists}
                  fetchStylists={fetchStylists}
                  handleClientStylistAndMessageUpdate={handleClientStylistAndMessageUpdate}
                  editForm={editForm}
                  setEditForm={setEditForm}
                />}
              />
              <Route path="/ask-ai" element={<ClientAskAIPage/>} />
              <Route path="/client-event"  element={<ClientEventPage auth={auth}/>} />
            </>
          )}

          {auth && auth.role === 'stylist' && (
            <Route path="/stylist-dashboard" element={<StylistHomePage auth={auth} api={api} setError={setError} setSuccess={setSuccess} myClients={myClients} />} />
          )}
          <Route path="/ask-ai" element={<ClientAskAIPage/>} />
          <Route
            path="/client-list"
            element={<ClientList
              auth={auth}
              myClients={myClients}
              fetchMyClients={fetchMyClients}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />}
          />
          <Route
            path="/stylist/clients/:clientId"
            element={<ClientDetail
              auth={auth}
              myClients={myClients}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />}
          />

          {auth && auth.role === 'admin' && (
            <>
               <Route path="/admin-dashboard" element={<AdminHomePage auth={auth} setError={setError} setSuccess={setSuccess} />} />
              {/* ADMIN ROUTES */}
              <Route
                path="/all-client-list"
                element={<AllClientList
                  auth={auth}
                  allClients={allClients}
                  fetchAllClients={fetchAllClients}
                  error={error}
                  setError={setError}
                  success={success}
                  setSuccess={setSuccess}
                />}
              />
              <Route
                path="/all-stylist-list"
                element={<AllStylistList
                  auth={auth}
                  allStylists={allStylists}
                  fetchAllStylists={fetchAllStylists}
                  error={error}
                  setError={setError}
                  success={success}
                  setSuccess={setSuccess}
                />}
              />
              <Route
                path="/admin/clients/:clientId"
                element={<AdminClientDetail
                  auth={auth}
                  api={api}
                  error={error}
                  setError={setError}
                  success={success}
                  setSuccess={setSuccess}
                  handleAdminEditClient={handleAdminEditClient}
                  handleAdminDeleteClient={handleAdminDeleteClient}
                />}
              />
              <Route
                path="/admin/stylists/:stylistId"
                element={<AdminStylistDetail
                  auth={auth}
                  api={api}
                  error={error}
                  setError={setError}
                  success={success}
                  setSuccess={setSuccess}
                  handleAdminEditStylist={handleAdminEditStylist}
                  handleAdminDeleteStylist={handleAdminDeleteStylist}
                />}
              />
            </>
          )}

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
          {/* Fallback routes for admin lists/details if not authorized (these should ideally be handled by individual components with redirects) */}
          <Route
            path="/all-client-list"
            element={!auth || auth.role !== 'admin' ? <div className="text-center p-8 text-red-600">Please log in as an admin to view the client list.</div> : null}
          />
          <Route
            path="/all-stylist-list"
            element={!auth || auth.role !== 'admin' ? <div className="text-center p-8 text-red-600">Please log in as an admin to view the stylist list.</div> : null}
          />
          <Route
            path="/admin/clients/:clientId"
            element={!auth || auth.role !== 'admin' ? <div className="text-center p-8 text-red-600">Please log in as an admin to view client details.</div> : null}
          />
            <Route
            path="/admin/stylists/:stylistId"
            element={!auth || auth.role !== 'admin' ? <div className="text-center p-8 text-red-600">Please log in as an admin to view stylist details.</div> : null}
          />

          <Route path="*" element={<h2 className="text-center p-8 text-red-600">404 - Page Not Found</h2>} />
        </Routes>
      </AuthContext.Provider> 
    </>
  );
}

export default App;