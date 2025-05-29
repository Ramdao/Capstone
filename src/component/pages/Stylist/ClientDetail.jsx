import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom'; // Import useParams, useLocation, useNavigate
import '../PageGlobal.css'; 

export default function ClientDetail({
  auth,
  myClients, // Passed from App.jsx, contains all clients for the stylist
  error,
  setError,
  success,
  setSuccess,
}) {
  const { clientId } = useParams(); // Get client ID from URL
  const location = useLocation(); // Get location object to access state
  const navigate = useNavigate(); // For programmatic navigation

  // State to hold the current client's details
  const [client, setClient] = useState(null);

  useEffect(() => {
    setError('');
    setSuccess('');

    if (!auth || auth.role !== 'stylist') {
      // Redirect or show error if not authorized
      navigate('/stylist-dashboard', { replace: true });
      setError('Unauthorized access to client details.');
      return;
    }

    // Attempt to get client from location state first (passed from ClientList)
    if (location.state && location.state.client) {
      setClient(location.state.client);
    } else if (myClients && myClients.length > 0) {
      // If not in state, try to find it in the myClients array (from App.jsx)
      const foundClient = myClients.find(c => c.id.toString() === clientId);
      if (foundClient) {
        setClient(foundClient);
      } else {
        setError('Client not found in your assigned clients.');
        setClient(null); // Clear client if not found
      }
    } else {
      // Fallback if myClients is empty or not yet loaded
      setError('Client data not available. Please go back to client list and try again.');
      setClient(null);
    }
  }, [clientId, location.state, myClients, auth, navigate, setError, setSuccess]); // Add dependencies

  if (!client) {
    return (
      <div className="text-center p-8 text-red-600">
        {error || 'Loading client details or client not found.'}
      </div>
    );
  }

  // Format colors for display
  const clientColors = Array.isArray(client.colors)
    ? client.colors.join(', ')
    : client.colors || 'N/A';

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
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        <div className="profile-details">
          <p><strong>Name:</strong> {client.user?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {client.user?.email || 'N/A'}</p>
          <p><strong>Country:</strong> {client.country || 'N/A'}</p>
          <p><strong>City:</strong> {client.city || 'N/A'}</p>
          <p><strong>Body Type:</strong> {client.body_type || 'N/A'}</p>
          <p><strong>Favorite Colors:</strong> {clientColors}</p>
          <p><strong>Message to Stylist:</strong> {client.message_to_stylist || 'No message'}</p>
          {/* You can add more client-specific details here */}

          <div className="mt-6">
            <button
              onClick={() => navigate('/client-list')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back to Client List
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
