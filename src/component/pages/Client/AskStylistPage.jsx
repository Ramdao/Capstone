import React, { useState, useEffect } from 'react'; // Ensure useState and useEffect are imported
import { motion } from 'framer-motion';
import '../PageGlobal.css';

export default function AskAStylistPage({
  auth,
  error,
  setError,
  success,
  setSuccess,
  fetchAuthenticatedUser,
  availableStylists,
  fetchStylists,
  // This is the new, dedicated function from App.jsx
  handleClientStylistAndMessageUpdate,
  // editForm and setEditForm are kept for consistency with App.jsx's state management,
  // even if this component doesn't directly modify editForm for saving.
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
    // Optional: If no stylist is currently selected, pre-select the first available stylist
    // This provides a better UX by giving a default choice.
    if (!auth?.client?.stylist_id && availableStylists && availableStylists.length > 0) {
        setLocalSelectedStylistId(availableStylists[0].id);
    }
  }, [auth, availableStylists]); // Re-run when auth or availableStylists change

  // Effect to fetch stylists if they haven't been loaded yet
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
        // If the update was successful, fetchAuthenticatedUser (called within handleClientStylistAndMessageUpdate)
        // will refresh the global 'auth' state, which in turn updates the local state in this component
        // via the useEffect hook above. No need for manual setEditForm here.
      }
    } catch (err) {
      // Error handling is primarily done in handleClientStylistAndMessageUpdate,
      // but this catch block is a fallback for unexpected issues.
      console.error("Error during stylist/message update submission:", err);
      setError(err.response?.data?.message || 'An unexpected error occurred during update.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Display a loading/unauthorized message if client data isn't ready
  if (!auth || auth.role !== 'client' || !auth.client) {
    return (
      <div className="text-center p-8 text-red-600">
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
        className='box'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">Connect with a Stylist</h2>

        {/* Display Error and Success Messages */}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Current Stylist:</h3>
          {currentStylist ? (
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-medium">{currentStylist.user?.name}</p>
              <p className="text-gray-600">{currentStylist.user?.email}</p>
              {auth.client.message_to_stylist && (
                <div className="mt-2">
                  <p className="font-medium">Your Message:</p>
                  <p className="text-gray-600">{auth.client.message_to_stylist}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">You haven't selected a stylist yet.</p>
          )}
        </div>

        {/* Form for choosing a stylist and sending a message */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="stylist-select" className="block text-gray-700 text-sm font-bold mb-2">
              Choose a Stylist:
            </label>
            <select
              id="stylist-select"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
            <label htmlFor="message-to-stylist" className="block text-gray-700 text-sm font-bold mb-2">
              Your Message:
            </label>
            <textarea
              id="message-to-stylist"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              value={localMessageToStylist}
              onChange={(e) => setLocalMessageToStylist(e.target.value)}
              placeholder="Tell your stylist about your style preferences, needs, or any questions..."
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
