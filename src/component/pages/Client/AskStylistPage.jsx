import React, { useState, useEffect } from 'react'; // Ensure useState and useEffect are imported
import { motion } from 'framer-motion';
import '../PageGlobal.css';
import "./Askstylist.css"
export default function AskAStylistPage({
  auth,
  error,
  setError,
  success,
  setSuccess,
  fetchAuthenticatedUser,
  availableStylists,
  fetchStylists,
  
  handleClientStylistAndMessageUpdate,
  
  editForm,
  setEditForm
}) {
  // Local state to manage the input fields for stylist and message
  const [localSelectedStylistId, setLocalSelectedStylistId] = useState('');
  const [localMessageToStylist, setLocalMessageToStylist] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effect to initialize local state from the authenticated user's data
  // This ensures the form fields reflect the current saved values.
  useEffect(() => {
    if (auth && auth.role === 'client' && auth.client) {
      setLocalSelectedStylistId(auth.client.stylist_id || '');
      setLocalMessageToStylist(auth.client.message_to_stylist || '');
    }
    
    if (!auth?.client?.stylist_id && availableStylists && availableStylists.length > 0) {
        setLocalSelectedStylistId(availableStylists[0].id);
    }
  }, [auth, availableStylists]); // 

  useEffect(() => {
    if (!availableStylists || availableStylists.length === 0) {
      fetchStylists().catch(err => {
        console.error("Error fetching stylists:", err);
        setError('Failed to load stylists. Please try again.');
      });
    }
  }, [availableStylists, fetchStylists, setError]); // Re-run when availableStylists or fetchStylists change

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setIsLoading(true); // Set loading state
    setError(''); // Clear previous errors
    setSuccess(''); // Clear previous success messages

    try {
      // Call the new dedicated function from App.jsx to update both stylist and message
      const updateSuccessful = await handleClientStylistAndMessageUpdate(
        localSelectedStylistId,
        localMessageToStylist
      );

      if (updateSuccessful) {

      }
    } catch (err) {
      
      console.error("Error during stylist/message update submission:", err);
      setError(err.response?.data?.message || 'An unexpected error occurred during update.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Display a loading/unauthorized message if client data isn't ready
  if (!auth || auth.role !== 'client' || !auth.client) {
    return (
      <div >
        Please log in as a client to access this page, or profile data is loading.
      </div>
    );
  }

  // Find the currently selected stylist for display purposes
  const currentStylist = availableStylists?.find(
    stylist => stylist.id === auth.client.stylist_id
  );

  return (
    <div className='pagelayout'>
      <motion.h1
        className='about-heading'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Ask a Stylist
      </motion.h1>

      <motion.div
        className='box-askstylist'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        

        {/* Display Error and Success Messages */}
        {/* {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>} */}

        <div className='stylist-info'>
          <h2>Current Stylist:</h2>
          {currentStylist ? (
            <div >
              <p >{currentStylist.user?.name}</p>
              <p >{currentStylist.user?.email}</p>
             
            </div>
          ) : (
            <p>You haven't selected a stylist yet.</p>
          )}
        </div>

        {/* Form for choosing a stylist and sending a message */}
        <form onSubmit={handleSubmit} className='stylist-select-container'>
          <div >
            <label htmlFor="stylist-select">
              Choose a Stylist:
            </label>
            <select
              id="stylist-select"
              value={localSelectedStylistId}
              onChange={(e) => setLocalSelectedStylistId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- Select a Stylist --</option>
              {availableStylists?.map((stylist) => (
                <option key={stylist.id} value={stylist.id}>
                  {stylist.user?.name || 'Stylist'} ({stylist.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="message-to-stylist">
              Your Message:
            </label>
            <textarea
              id="message-to-stylist"
          
              value={localMessageToStylist}
              onChange={(e) => setLocalMessageToStylist(e.target.value)}
    
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              className="nav"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
