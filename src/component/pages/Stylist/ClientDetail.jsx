import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../PageGlobal.css';

// Import Firebase Storage functions directly
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../../firebase.js'; 

export default function ClientDetail({
  auth,
  myClients,
  error,
  setError,
  success,
  setSuccess,
}) {
  const { clientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);

  // --- Upload State and Handlers ---
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [uploadError, setUploadError] = useState(""); // Specific error for upload
  const [uploadSuccess, setUploadSuccess] = useState(""); // Specific success for upload

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(""); // Clear previous errors
      setUploadSuccess(""); // Clear previous success
    }
  };

  const handleUpload = () => {
    if (!client || !client.user || !client.user.email) {
      setUploadError("Client email is not available to create folder.");
      return;
    }
    if (!file) {
      setUploadError("Please select a file to upload.");
      return;
    }

    // Determine the folder name dynamically using the client's email
    // Replace dots with ' DOT ' if your Firebase rules or storage structure requires it
    const clientEmailPath = client.user.email;
    const folderName = `clients/${clientEmailPath}`;
    
    const path = `${folderName}/${file.name}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadProgress(0);
    setUploadError("");
    setUploadSuccess("Upload started...");

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        setUploadError(`Upload failed: ${error.message}`);
        setUploadSuccess(""); // Clear success message on error
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadUrl(url);
          setUploadSuccess("Upload complete!");
          setUploadError(""); // Clear error message on success
          setFile(null); // Clear the selected file after successful upload
          // Optionally, you might want to save this URL to the client's profile in Firestore
          // Example: auth.updateClientProfile(client.id, { uploadedModels: [...client.uploadedModels, url] });
        });
      }
    );
  };
  // --- End Upload State and Handlers ---

  useEffect(() => {
    setError('');
    setSuccess('');

    if (!auth || auth.role !== 'stylist') {
      navigate('/stylist-dashboard', { replace: true });
      setError('Unauthorized access to client details.');
      return;
    }

    if (location.state && location.state.client) {
      setClient(location.state.client);
    } else if (myClients && myClients.length > 0) {
      const foundClient = myClients.find(c => c.id.toString() === clientId);
      if (foundClient) {
        setClient(foundClient);
      } else {
        setError('Client not found in your assigned clients.');
        setClient(null);
      }
    } else {
      setError('Client data not available. Please go back to client list and try again.');
      setClient(null);
    }
  }, [clientId, location.state, myClients, auth, navigate, setError, setSuccess]);

  if (!client) {
    return (
      <div className="text-center p-8 text-red-600">
        {error || 'Loading client details or client not found.'}
      </div>
    );
  }

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
          <p className='listp profile-styling'><strong>Name:</strong> {client.user?.name || 'N/A'}</p>
          <p className='listp profile-styling'><strong>Email:</strong> {client.user?.email || 'N/A'}</p>
          <p className='listp profile-styling'><strong>Country:</strong> {client.country || 'N/A'}</p>
          <p className='listp profile-styling'><strong>City:</strong> {client.city || 'N/A'}</p>
          <p className='listp profile-styling'><strong>Body Type:</strong> {client.body_type || 'N/A'}</p>
          <p className='listp profile-styling'> <strong>Favorite Colors:</strong> {clientColors}</p>
          <p className='listp profile-styling'><strong>Message to Stylist:</strong> {client.message_to_stylist || 'No message'}</p>
          {/* Add more client-specific details here */}

          {/* --- Upload Section for Stylists --- */}
          {auth && auth.role === 'stylist' && client.user?.email && (
            <div className="mt-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
              <h4 className="text-lg font-semibold mb-3">Upload Model for Client ({client.user.email})</h4>
              
              <input 
                type="file" 
                accept=".glb" 
                onChange={handleFileChange} 
                className='nav-stylist'
              />
              
              <button 
                onClick={handleUpload} 
                className="nav-stylist"
                disabled={!file} // Disable button if no file is selected
              >
                Upload {file ? file.name : '.glb File'}
              </button>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3 text-sm text-gray-700">Upload Progress: {uploadProgress.toFixed(0)}%</div>
              )}
              {uploadError && <div className="mt-3 text-sm text-red-600">{uploadError}</div>}
              {uploadSuccess && <div className="mt-3 text-sm text-green-600">{uploadSuccess}</div>}
              
            </div>
          )}
          {/* --- End Upload Section --- */}

          <div className="mt-6">
            <button
              onClick={() => navigate('/client-list')}
              className="nav-stylist"
            >
              Back to Client List
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}