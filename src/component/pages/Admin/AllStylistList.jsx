import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../PageGlobal.css'; // Adjust path if necessary

export default function AllStylistList({
  auth,
  allStylists,
  fetchAllStylists,
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

    if (!allStylists || allStylists.length === 0) {
      fetchAllStylists();
    }
  }, [auth, allStylists, fetchAllStylists, navigate, setError, setSuccess]);

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
        All Stylists
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        {allStylists && allStylists.length > 0 ? (
          <ul className="space-y-4">
            {allStylists.map(stylist => (
              <li key={stylist.id} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <Link
                  to={`/admin/stylists/${stylist.id}`}
                  state={{ stylist }} // Pass stylist object via state for detail page
                  className="block text-blue-700 hover:text-blue-900 font-semibold text-lg"
                >
                  {stylist.user?.name || 'Stylist Name'} ({stylist.user?.email || 'No Email'})
                </Link>
                
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">No stylists found.</p>
        )}
      </motion.div>
    </div>
  );
}