import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link for navigation
import '../PageGlobal.css'; 

export default function ClientList({
  auth,
  myClients,
  fetchMyClients,
  error,
  setError,
  success,
  setSuccess,
}) {
  useEffect(() => {
    // Clear any previous error/success messages when component mounts
    setError('');
    setSuccess('');

    // Fetch clients only if authenticated as a stylist and clients haven't been loaded yet
    if (auth && auth.role === 'stylist' && (!myClients || myClients.length === 0)) {
      fetchMyClients();
    }
  }, [auth, myClients, fetchMyClients, setError, setSuccess]); // Add dependencies for useCallback

  if (!auth || auth.role !== 'stylist') {
    return (
      <div className="text-center p-8 text-red-600">
        You are not authorized to view this page. Please log in as a stylist.
      </div>
    );
  }

  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        My Clients
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        {myClients && myClients.length > 0 ? (
          <ul className="space-y-4">
            {myClients.map(client => (
              <li key={client.id} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <Link
                  to={`/stylist/clients/${client.id}`}
                  // Pass the entire client object as state to the detail page
                  state={{ client }}
                  className="block text-blue-700 hover:text-blue-900 font-semibold text-lg"
                >
                  {client.user?.name || 'Client Name'} ({client.user?.email || 'No Email'})
                </Link>
                <p className="text-gray-600 text-sm mt-1">
                  Country: {client.country || 'N/A'} | City: {client.city || 'N/A'}
                </p>
                {client.message_to_stylist && (
                  <p className="text-gray-500 text-sm italic mt-2">
                    Message: "{client.message_to_stylist}"
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">No clients assigned to you yet.</p>
        )}
      </motion.div>
    </div>
  );
}
