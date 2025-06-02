import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../PageGlobal.css'; 

export default function AdminStylistDetail({
  auth,
  api, // axios instance
  error,
  setError,
  success,
  setSuccess,
  handleAdminEditStylist,
  handleAdminDeleteStylist,
}) {
  const { stylistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [stylist, setStylist] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    // Removed experience_years and specialties from formData
  });

  const fetchStylistDetail = async () => {
    try {
      const res = await api.get(`/api/admin/stylists/${stylistId}`);
      const fetchedStylist = res.data.stylist;
      setStylist(fetchedStylist);
      setFormData({
        name: fetchedStylist.user?.name || '',
        email: fetchedStylist.user?.email || '',
        password: '',
        password_confirmation: '',
      });
      setError('');
    } catch (err) {
      console.error("Error fetching stylist details:", err);
      setError(err.response?.data?.message || 'Failed to fetch stylist details.');
      setStylist(null);
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

    if (location.state && location.state.stylist) {
      setStylist(location.state.stylist);
      setFormData({
        name: location.state.stylist.user?.name || '',
        email: location.state.stylist.user?.email || '',
        password: '',
        password_confirmation: '',
      });
    } else {
      fetchStylistDetail();
    }
  }, [stylistId, location.state, auth, navigate, setError, setSuccess, api]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isSuccess = await handleAdminEditStylist(stylistId, formData);
    if (isSuccess) {
        setEditMode(false);
        fetchStylistDetail(); // Re-fetch to ensure updated data is displayed
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this stylist's account? This action cannot be undone.")) {
      const isSuccess = await handleAdminDeleteStylist(stylistId);
      if (isSuccess) {
        navigate('/all-stylist-list');
      }
    }
  };

  if (!auth || auth.role !== 'admin') {
    return null;
  }

  if (!stylist) {
    return (
      <div className="text-center p-8 text-red-600">
        {error || 'Loading stylist details or stylist not found.'}
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
        Stylist Details: {stylist.user?.name || 'N/A'}
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        {!editMode ? (
          <div className="profile-details">
            <p><strong>Name:</strong> {stylist.user?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {stylist.user?.email || 'N/A'}</p>
          

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
                onClick={() => navigate('/all-stylist-list')}
                className="button-nav edit"
              >
                Back to All Stylists
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