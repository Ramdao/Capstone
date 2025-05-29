import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../PageGlobal.css'; // Adjust path if necessary

export default function AllClientList({
  auth,
  allClients,
  fetchAllClients,
  error,
  setError,
  success,
  setSuccess,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    setSuccess('');

    if (!auth || auth.role !== 'admin') {
      navigate('/admin-dashboard', { replace: true });
      setError('Unauthorized access. Please log in as an administrator.');
      return;
    }

    // Only fetch if data is not already loaded or if a refresh is needed
    if (!allClients || allClients.length === 0) {
      fetchAllClients();
    }
  }, [auth, allClients, fetchAllClients, navigate, setError, setSuccess]);

  if (!auth || auth.role !== 'admin') {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        All Clients
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        {allClients && allClients.length > 0 ? (
          <ul className="space-y-4">
            {allClients.map(client => (
              <li key={client.id} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <Link
                  to={`/admin/clients/${client.id}`}
                  state={{ client }} // Pass client object via state for detail page
                  className="block text-blue-700 hover:text-blue-900 font-semibold text-lg"
                >
                  {client.user?.name || 'Client Name'} ({client.user?.email || 'No Email'})
                </Link>
                <p className="text-gray-600 text-sm mt-1">
                  Country: {client.country || 'N/A'} | City: {client.city || 'N/A'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">No clients found.</p>
        )}
      </motion.div>
    </div>
  );
}