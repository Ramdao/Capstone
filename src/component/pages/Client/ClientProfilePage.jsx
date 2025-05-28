import React, { useState, useEffect } from 'react'; // Import useEffect and useState
import { motion } from 'framer-motion';
import '../PageGlobal.css';

export default function ClientProfilePage({
  auth,
  editForm,
  setEditForm,
  handleUpdateProfile,
  error,
  setError, // Add setError prop
  success,
  setSuccess, // Add setSuccess prop
  fetchAuthenticatedUser // Add fetchAuthenticatedUser prop
}) {
  // State to manage edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Use a local state for form fields if you want to allow edits without immediately
  // updating the global editForm state until "Save" is clicked.
  // For simplicity and to directly use handleUpdateProfile from App.jsx,
  // we'll primarily use the passed editForm.

  // Effect to initialize editForm when auth changes or when entering edit mode
  // This ensures the form inputs are populated with the current, correct data.
  useEffect(() => {
    if (auth && auth.role === 'client' && auth.client) {
      // Ensure colors are properly formatted for the input field
      const formattedColors = Array.isArray(auth.client.colors)
        ? auth.client.colors.join(', ')
        : auth.client.colors || '';

      setEditForm({
        name: auth.name || '',
        email: auth.email || '',
        // password and password_confirmation should generally not be pre-filled for security
        password: '',
        password_confirmation: '',
        country: auth.client.country || '',
        city: auth.client.city || '',
        body_type: auth.client.body_type || '',
        colors: formattedColors,
       
      });
    }
  }, [auth, setEditForm]); // Re-run if auth object or setEditForm changes

  // Handle input changes for the form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // Clear any previous error/success messages before attempting save
    setError('');
    setSuccess('');

    // Call the update function from App.jsx
    await handleUpdateProfile();

    // After updating, re-fetch user data to ensure the UI is fresh with the latest data
    await fetchAuthenticatedUser(); // This will update 'auth' state in App.jsx and propagate down

    // Exit edit mode only if no error occurred after the update
    if (!error) { // This check relies on error being set synchronously by handleUpdateProfile
                   // A more robust check might be to check the response of handleUpdateProfile directly if it returns a boolean
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    // Reset the form fields to the original auth data
    if (auth && auth.role === 'client' && auth.client) {
      const formattedColors = Array.isArray(auth.client.colors)
        ? auth.client.colors.join(', ')
        : auth.client.colors || '';

      setEditForm({
        name: auth.name || '',
        email: auth.email || '',
        password: '',
        password_confirmation: '',
        country: auth.client.country || '',
        city: auth.client.city || '',
        body_type: auth.client.body_type || '',
        colors: formattedColors,
        
      });
    }
    setError(''); // Clear errors on cancel
    setSuccess(''); // Clear success on cancel
    setIsEditing(false); // Exit edit mode
  };

  // Check if auth or client profile data is not available
  if (!auth || auth.role !== 'client' || !auth.client) {
    return (
      <div className="text-center p-8 text-red-600">
        You are not logged in as a client, or profile data is loading.
      </div>
    );
  }

  // Assign clientProfile directly from auth.client for clarity in rendering
  const clientProfile = auth.client;
  let clientColors = Array.isArray(clientProfile.colors)
    ? clientProfile.colors.join(', ')
    : clientProfile.colors || ''; // For display, can be array or string

  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Client Profile
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        

        {/* Display Error and Success Messages */}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        <div className="profile-details">
          {isEditing ? (
            // Edit Mode: Render input fields
            <form onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
              <p>
                <strong>Name:</strong>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>
              <p>
                <strong>Email:</strong>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>
              {/* Optional: Add password fields for update */}
              <p>
                <strong>New Password:</strong>
                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>
              <p>
                <strong>Confirm Password:</strong>
                <input
                  type="password"
                  name="password_confirmation"
                  value={editForm.password_confirmation}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>

              <p>
                <strong>Country:</strong>
                <input
                  type="text"
                  name="country"
                  value={editForm.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>
              <p>
                <strong>City:</strong>
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>
              <p>
                <strong>Body Type:</strong>
                <input
                  type="text"
                  name="body_type"
                  value={editForm.body_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                />
              </p>
              <p>
                <strong>Favorite Colors (comma-separated):</strong>
                <input
                  type="text"
                  name="colors"
                  value={editForm.colors}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded mt-1"
                  placeholder="e.g., red, blue, green"
                />
              </p>
              

              <div className="mt-4 flex space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            // View Mode: Render plain text
            <>
              <p><strong>Name:</strong> {auth.name}</p>
              <p><strong>Email:</strong> {auth.email}</p>
              <p><strong>Role:</strong> {auth.role}</p>

              {clientProfile?.country && <p><strong>Country:</strong> {clientProfile.country}</p>}
              {clientProfile?.city && <p><strong>City:</strong> {clientProfile.city}</p>}
              {clientProfile?.body_type && <p><strong>Body Type:</strong> {clientProfile.body_type}</p>}

              {clientColors && <p><strong>Favorite Colors:</strong> {clientColors}</p>}

             

              <div className="mt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Edit Profile
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}