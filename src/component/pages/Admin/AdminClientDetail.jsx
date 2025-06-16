import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../PageGlobal.css';
// Import Firebase Storage functions
import { storage, ref, listAll, deleteObject } from '../../../firebase.js';

export default function AdminClientDetail({
  auth,
  api, // axios instance
  error,
  setError,
  success,
  setSuccess,
  handleAdminEditClient,
  handleAdminDeleteClient,
}) {
  const { clientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    country: '',
    city: '',
    body_type: '',
    colors: '',
    message_to_stylist: '',
  });

  const fetchClientDetail = async () => {
    try {
      const res = await api.get(`/api/admin/clients/${clientId}`);
      const fetchedClient = res.data.client;
      setClient(fetchedClient);
      setFormData({
        name: fetchedClient.user?.name || '',
        email: fetchedClient.user?.email || '',
        password: '',
        password_confirmation: '',
        country: fetchedClient.country || '',
        city: fetchedClient.city || '',
        body_type: fetchedClient.body_type || '',
        colors: Array.isArray(fetchedClient.colors) ? fetchedClient.colors.join(', ') : (fetchedClient.colors || ''),
        message_to_stylist: fetchedClient.message_to_stylist || '',
      });
      setError('');
    } catch (err) {
      console.error("Error fetching client details:", err);
      setError(err.response?.data?.message || 'Failed to fetch client details.');
      setClient(null);
    }
  };

  useEffect(() => {
    setError('');
    setSuccess('');

    if (!auth || auth.role !== 'admin') {
      navigate('/admin-dashboard', { replace: true });
      setError('Unauthorized access. Please log in as an administrator.');
      return;
    }

    // Try to get client from location state first to avoid extra API call
    if (location.state && location.state.client) {
      setClient(location.state.client);
      setFormData({
        name: location.state.client.user?.name || '',
        email: location.state.client.user?.email || '',
        password: '',
        password_confirmation: '',
        country: location.state.client.country || '',
        city: location.state.client.city || '',
        body_type: location.state.client.body_type || '',
        colors: Array.isArray(location.state.client.colors) ? location.state.client.colors.join(', ') : (location.state.client.colors || ''),
        message_to_stylist: location.state.client.message_to_stylist || '',
      });
    } else {
      // If not in state, fetch from API
      fetchClientDetail();
    }
  }, [clientId, location.state, auth, navigate, setError, setSuccess, api]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isSuccess = await handleAdminEditClient(clientId, {
        ...formData,
        // Ensure colors is sent as a JSON string if it's an array
        colors: formData.colors ? JSON.stringify(formData.colors.split(',').map(c => c.trim()).filter(c => c !== '')) : JSON.stringify([])
    });
    if (isSuccess) {
        setEditMode(false);
        fetchClientDetail(); // Re-fetch to ensure updated data is displayed
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this client's account? This action cannot be undone.")) {
      setSuccess(''); // Clear previous success messages
      setError(''); // Clear previous error messages

      if (!client || !client.user || !client.user.email) {
        setError("Client email not available to delete storage folder.");
        return;
      }

      const clientEmailPath = client.user.email;
      const folderPath = `clients/${clientEmailPath}`;
      const folderRef = ref(storage, folderPath);

      try {
        // List all items (files) within the client's folder
        const listResult = await listAll(folderRef);

        // Delete all files in the folder
        const deleteFilePromises = listResult.items.map(itemRef => deleteObject(itemRef));
        await Promise.all(deleteFilePromises);

        setSuccess("Client's storage folder and its contents deleted successfully.");
      } catch (storageError) {
        console.error("Error deleting client's storage folder:", storageError);
        setError(`Failed to delete client's storage folder: ${storageError.message}. Proceeding with account deletion.`);
        
      }

      // Proceed with deleting the client record from the database
      const isSuccess = await handleAdminDeleteClient(clientId);
      if (isSuccess) {
        navigate('/all-client-list'); // Redirect to list after deletion
      } else {
        
        setError((prevError) => prevError ? `${prevError} And failed to delete client account from database.` : "Failed to delete client account from database.");
      }
    }
  };

  if (!auth || auth.role !== 'admin') {
    return null; // Will be redirected by useEffect
  }

  if (!client) {
    return (
      <div className="text-center p-8 text-red-600">
        {error || 'Loading client details or client not found.'}
      </div>
    );
  }

  // Ensure colors are displayed correctly, handling both array and stringified array formats
  const clientColors = Array.isArray(client.colors)
    ? client.colors.join(', ')
    : (client.colors && typeof client.colors === 'string' && client.colors.startsWith('[') && client.colors.endsWith(']'))
      ? JSON.parse(client.colors).join(', ')
      : 'N/A';

  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Client Details: {client.user?.name || 'N/A'}
      </motion.h1>

      <motion.div
        className='box box-edit'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        {!editMode ? (
          <div className="profile-details">
            <p className='profile-styling'><strong>Name:</strong> {client.user?.name || 'N/A'}</p>
            <p className='profile-styling'><strong>Email:</strong> {client.user?.email || 'N/A'}</p>
            <p className='profile-styling'><strong>Country:</strong> {client.country || 'N/A'}</p>
            <p className='profile-styling'><strong>City:</strong> {client.city || 'N/A'}</p>
            <p className='profile-styling'><strong>Body Type:</strong> {client.body_type || 'N/A'}</p>
            <p className='profile-styling'><strong>Favorite Colors:</strong> {clientColors}</p>
            <p className='profile-styling'><strong>Message to Stylist:</strong> {client.message_to_stylist || 'No message'}</p>

            <div className="mt-6 space-x-4">
              <button
                onClick={() => setEditMode(true)}
                className="button-nav edit"
              >
                Edit Account
              </button>
              <button
                onClick={handleDelete}
                className="button-nav edit"
              >
                Delete Account
              </button>
              <button
                onClick={() => navigate('/all-client-list')}
                className="button-nav edit"
              >
                Back to All Clients
              </button>
            </div>
          </div>
        ) : (

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name:</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email:</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">New Password (optional):</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password_confirmation">Confirm Password:</label>
              <input type="password" name="password_confirmation" id="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">Country:</label>
              <input type="text" name="country" id="country" value={formData.country} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">City: </label>
              <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="body_type">Body Type:</label>
              <input type="text" name="body_type" id="body_type" value={formData.body_type} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="colors">Favorite Colors (comma-separated):</label>
              <input type="text" name="colors" id="colors" value={formData.colors} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message_to_stylist">Message to Stylist:</label>
              <textarea name="message_to_stylist" id="message_to_stylist" value={formData.message_to_stylist} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>

            <div className="mt-6 space-x-4">
              <button type="submit" className="button-nav update">Save Changes</button>
              <button type="button" onClick={() => setEditMode(false)} className="button-nav update">Cancel</button>
            </div>
          </form>

        )}
      </motion.div>
    </div>
  );
}
