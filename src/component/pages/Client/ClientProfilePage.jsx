import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../PageGlobal.css';

export default function ClientProfilePage({
  auth,
  editForm,
  setEditForm,
  handleUpdateProfile,
  error,
  setError,
  success,
  setSuccess,
  fetchAuthenticatedUser
}) {
  // State to manage edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Options for the Body Type dropdown
  const bodyTypeOptions = [
    { value: '', label: 'Select Body Type' }, 
    { value: 'Dramatic', label: 'Dramatic' },
    { value: 'Natural', label: 'Natural' },
    { value: 'Classic', label: 'Classic' },
    { value: 'Gamine', label: 'Gamine' },
    { value: 'Romantic', label: 'Romantic' },
  ];

  useEffect(() => {
    if (auth && auth.role === 'client' && auth.client) {
     
      let colorsArray = [];

      try {
        // Handle different possible formats
        if (Array.isArray(auth.client.colors)) {
          colorsArray = auth.client.colors;
        } else if (typeof auth.client.colors === 'string') {
          // Try to parse as JSON if it's a string
          const parsed = JSON.parse(auth.client.colors);
          colorsArray = Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
        }
      } catch (e) {
        // If parsing fails, treat as comma-separated string (fallback)
        colorsArray = (auth.client.colors || '').split(',').map(c => c.trim()).filter(Boolean);
      }

      // Clean up each color string
      colorsArray = colorsArray.map(color => {
        // Remove any extra quotes or brackets
        return color.replace(/^["'\[\\]+|["'\]\\]+$/g, '');
      }).filter(Boolean);

      setEditForm({
        name: auth.name || '',
        email: auth.email || '',
        password: '',
        password_confirmation: '',
        country: auth.client.country || '',
        city: auth.client.city || '',
        body_type: auth.client.body_type || '', 
        colors: colorsArray.join(', '),
        message_to_stylist: auth.client.message_to_stylist || '',
        stylist_id: auth.client.stylist_id || '',
      });
    }
  }, [auth, setEditForm]);

  // Handle input changes for the form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Process colors before saving
    const colorsToSave = editForm.colors
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)
      .map(color => {
        
        if (!color.startsWith('#') && !/^[0-9a-fA-F]{3,6}$/.test(color)) { // Simple check for hex without #
          // Assuming non-hex colors are names, no # needed
        } else if (!color.startsWith('#')) {
             color = `#${color}`;
        }
        // Remove any extra quotes
        return color.replace(/^["']+|["']+$/g, '');
      });

    // Create the update data with properly formatted colors
    const updateData = {
      ...editForm,
      colors: JSON.stringify(colorsToSave) // Store as JSON string
    };

    // Call the update function with the processed data
    await handleUpdateProfile(updateData);
    await fetchAuthenticatedUser();

    if (!error) {
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
        message_to_stylist: auth.client.message_to_stylist || '',
        stylist_id: auth.client.stylist_id || '',
      });
    }
    setError(''); // Clear errors on cancel
    setSuccess(''); // Clear success on cancel
    setIsEditing(false); // Exit edit mode
  };

  // Check if auth or client profile data is not available
  if (!auth || auth.role !== 'client' || !auth.client) {
    return (
      <div>
        You are not logged in as a client, or profile data is loading.
      </div>
    );
  }

  // Assign clientProfile directly from auth.client for clarity in rendering
  const clientProfile = auth.client;
  let clientColors = Array.isArray(clientProfile.colors)
    ? clientProfile.colors.join(', ')
    : clientProfile.colors || ''; 

  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Your Profile
      </motion.h1>

      <motion.div
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >

       

        <div className="profile-details">
          {isEditing ? (
            // Edit Mode: Render input fields
            <form onSubmit={(e) => e.preventDefault()}>
              <p >
                <strong>Name:</strong>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Email:</strong>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                />
              </p>

              <p>
                <strong>New Password:</strong>
                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Confirm Password:</strong>
                <input
                  type="password"
                  name="password_confirmation"
                  value={editForm.password_confirmation}
                  onChange={handleInputChange}
                />
              </p>

              <p>
                <strong>Country:</strong>
                <input
                  type="text"
                  name="country"
                  value={editForm.country}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>City: </strong>
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Body Type:</strong>
                <select
                  name="body_type"
                  value={editForm.body_type}
                  onChange={handleInputChange}
                  className="profile-input-select" 
                >
                  {bodyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </p>
              <p>
                <strong>Favorite Colors (comma-separated):</strong>
                <input
                  type="text"
                  name="colors"
                  value={editForm.colors}
                  onChange={handleInputChange}
                  placeholder="e.g., red, blue, green"
                />
              </p>


              <div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="button-nav update"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="button-nav update"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (

            <>
              <div class="user-profile-table-container">
                <table>
                  <tbody>
                    <tr>
                      <th>Name:</th>
                      <td>{auth.name}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{auth.email}</td>
                    </tr>
                    <tr>
                      <th>Role:</th>
                      <td>{auth.role}</td>
                    </tr>

                    {clientProfile?.country && (
                      <tr>
                        <th>Country:</th>
                        <td>{clientProfile.country}</td>
                      </tr>
                    )}
                    {clientProfile?.city && (
                      <tr>
                        <th>City:</th>
                        <td>{clientProfile.city}</td>
                      </tr>
                    )}
                    {clientProfile?.body_type && (
                      <tr>
                        <th>Body Type:</th>
                        <td>{clientProfile.body_type}</td>
                      </tr>
                    )}

                    {clientColors && (
                      <tr>
                        <th>Favorite Colors:</th>
                        <td><span class="favorite-colors-display">{clientColors}</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              <div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="button-nav edit"
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
