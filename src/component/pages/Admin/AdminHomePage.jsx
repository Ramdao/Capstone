import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { storage, ref, listAll, getDownloadURL, deleteObject, uploadBytesResumable } from '../../../firebase.js';
import { FiChevronDown, FiChevronUp, FiX, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import '../PageGlobal.css';
import './AdminHomePage.css';


import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import ClothingModel from "../../ClothingModel.jsx";

export default function AdminHomePage({ auth, setError, setSuccess }) {
    const [availableFolders, setAvailableFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [modelFiles, setModelFiles] = useState([]);
    const [selectedModelForViewer, setSelectedModelForViewer] = useState(null);
    const [currentModelIndex, setCurrentModelIndex] = useState(-1);

    const [loadingFolders, setLoadingFolders] = useState(true);
    const [folderError, setFolderError] = useState(null);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelFetchError, setModelFetchError] = useState(null);
    const [deletingModel, setDeletingModel] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);

    // Fetches all available folders in Firebase Storage, including client folders
    const fetchAllFolders = useCallback(async () => {
        // Basic authorization check
        if (!auth || auth.role !== 'admin') {
            setFolderError('Unauthorized access.');
            setLoadingFolders(false);
            return;
        }

        setLoadingFolders(true);
        setFolderError(null);
        // Initial set of predefined folders with trailing slashes
        let folders = [
            
            { path: "", name: "Summer" }, 
            { path: "Classic/", name: "Classic" },
            { path: "Dramatic/", name: "Dramatic" },
            { path: "Gamine/", name: "Gamine" },
            { path: "Natural/", name: "Natural" },
            { path: "Romantic/", name: "Romantic" }
        ];

        try {
            // Reference to the 'clients/' directory
            const clientsFolderRef = ref(storage, 'clients/');
            // List all items (sub-folders) within 'clients/'
            const clientsList = await listAll(clientsFolderRef);

            // Iterate through each sub-folder (prefix) which represents a client's email
            clientsList.prefixes.forEach(prefixRef => {
                const emailFolderName = prefixRef.name; // e.g., "user@example.com"
                folders.push({
                    path: prefixRef.fullPath + '/', // Full path includes "clients/user@example.com/"
                    name: `Client: ${emailFolderName}` // Display name for the dropdown
                });
            });

            setAvailableFolders(folders);
            // Set the default selected folder, prioritizing "Public Models" if available.
            // Ensure a default is always set, perhaps the first non-client folder.
            setSelectedFolder(folders.length > 0 ? folders[0].path : '');

        } catch (error) {
            console.error("Error fetching all Firebase folders:", error);
            setFolderError("Failed to load folders. Please try again.");
        } finally {
            setLoadingFolders(false);
        }
    }, [auth]); // Dependency on 'auth' to re-run if authentication status changes

    // Effect hook to fetch folders on component mount
    useEffect(() => {
        fetchAllFolders();
    }, [fetchAllFolders]);

    // Fetches 3D models (GLB/GLTF) from the currently selected Firebase Storage folder
    const fetchModelsInFolder = useCallback(async () => {
        // Clear models and viewer if no folder is selected
        if (!selectedFolder && selectedFolder !== "") {
            setModelFiles([]);
            setSelectedModelForViewer(null);
            setCurrentModelIndex(-1);
            return;
        }

        setLoadingModels(true);
        setModelFetchError(null);
        setDeleteSuccess(null); // Clear previous delete messages
        setDeleteError(null);   // Clear previous delete messages

        try {
            const folderRef = ref(storage, selectedFolder);
            const folderList = await listAll(folderRef); // List all items in the folder

            // Filter for .glb and .gltf files and get their download URLs
            const allUrls = await Promise.all(
                folderList.items
                    .filter(item => item.name.toLowerCase().endsWith('.glb') || item.name.toLowerCase().endsWith('.gltf'))
                    .map(item => getDownloadURL(item))
            );

            setModelFiles(allUrls);
            // Set the first model as selected for the viewer if models are found
            if (allUrls.length > 0) {
                setSelectedModelForViewer(allUrls[0]);
                setCurrentModelIndex(0);
            } else {
                setSelectedModelForViewer(null);
                setCurrentModelIndex(-1);
            }
        } catch (error) {
            console.error(`Error fetching models from Firebase folder '${selectedFolder}':`, error);
            setModelFetchError(`Failed to load models from ${selectedFolder}.`);
            setModelFiles([]);
            setSelectedModelForViewer(null);
            setCurrentModelIndex(-1);
        } finally {
            setLoadingModels(false);
        }
    }, [selectedFolder]); // Dependency on 'selectedFolder' to re-run when folder changes

    // Effect hook to fetch models whenever the selected folder changes
    useEffect(() => {
        fetchModelsInFolder();
    }, [fetchModelsInFolder]);

    // Handles setting the selected model for the 3D viewer
    const handleViewModel = (modelUrl, index) => {
        setSelectedModelForViewer(modelUrl);
        setCurrentModelIndex(index);
    };

    // Navigates between models in the viewer (previous/next)
    const navigateModelViewer = (direction) => {
        if (!modelFiles.length) return; // Do nothing if no models are loaded

        const totalModels = modelFiles.length;
        let newIndex = direction === 'next'
            ? (currentModelIndex + 1) % totalModels // Wrap around to the beginning
            : (currentModelIndex - 1 + totalModels) % totalModels; // Wrap around to the end

        setSelectedModelForViewer(modelFiles[newIndex]);
        setCurrentModelIndex(newIndex);
    };

    // Closes the 3D model viewer
    const handleCloseViewer = () => {
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    // Handles the deletion of the currently viewed model from Firebase Storage
    const handleDeleteModel = async () => {
        // Check if a model is selected and the user is authorized
        if (!selectedModelForViewer || !auth || auth.role !== 'admin') {
            setDeleteError("No model selected or unauthorized to delete.");
            return;
        }

       
        if (!window.confirm(`Are you sure you want to delete this model?\n${selectedModelForViewer.substring(selectedModelForViewer.lastIndexOf('/') + 1).split('?')[0]}`)) {
            return; // User cancelled deletion
        }

        setDeletingModel(true);
        setDeleteError(null);
        setDeleteSuccess(null);

        try {
            // Create a storage reference from the download URL
            const modelRef = ref(storage, selectedModelForViewer);
            await deleteObject(modelRef); // Delete the file

            setDeleteSuccess("Model deleted successfully!");
            // Update the local state to remove the deleted model
            const updatedModelFiles = modelFiles.filter(url => url !== selectedModelForViewer);
            setModelFiles(updatedModelFiles);

            // Adjust selected model for viewer after deletion
            if (updatedModelFiles.length > 0) {
                // If the deleted model was the last one, select the new last one
                const newIndex = currentModelIndex >= updatedModelFiles.length ? updatedModelFiles.length - 1 : currentModelIndex;
                setSelectedModelForViewer(updatedModelFiles[newIndex]);
                setCurrentModelIndex(newIndex);
            } else {
                // No models left
                setSelectedModelForViewer(null);
                setCurrentModelIndex(-1);
            }

        } catch (error) {
            console.error("Error deleting model:", error);
            setDeleteError(`Failed to delete model: ${error.message}`);
        } finally {
            setDeletingModel(false);
        }
    };

    // Handles the file upload to Firebase Storage
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadError("Please select a file to upload.");
            return;
        }
        if (!selectedFolder) {
            setUploadError("Please select a destination folder.");
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        setUploadSuccess(null);

        
        const filePath = `${selectedFolder}${selectedFile.name}`;
        const modelRef = ref(storage, filePath);

        // Start the upload task with progress tracking
        const uploadTask = uploadBytesResumable(modelRef, selectedFile);

        // Listen for state changes, errors, and completion of the upload.
        uploadTask.on('state_changed',
            (snapshot) => {
                // Calculate upload progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                setUploadError(`Upload failed: ${error.message}`);
                setUploading(false);
            },
            async () => {
                // Upload successful
                setUploading(false);
                setUploadSuccess("Model uploaded successfully!");
                setSelectedFile(null); // Clear the selected file input

                // Refresh the list of models in the current folder to show the newly uploaded one
                await fetchModelsInFolder();
            }
        );
    };

    return (
        <div className="admin-page-container">
            {/* Page Header */}
            <motion.div
                className="admin-page-header"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1>Admin Dashboard</h1>
                <p>Manage all 3D models in the system</p>
            </motion.div>

            {/* Main Content Box */}
            <motion.div
                className="admin-content-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
                {/* Folder Selection */}
                <div className="folder-selection-container">
                    <label htmlFor="admin-folder-select">Select Storage Location:</label>
                    <div className="folder-select-wrapper">
                        {loadingFolders ? (
                            <div className="loading-indicator">
                                <div className="spinner"></div>
                                <span>Loading folders...</span>
                            </div>
                        ) : (
                            <select
                                id="admin-folder-select"
                                onChange={(e) => setSelectedFolder(e.target.value)}
                                value={selectedFolder}
                                disabled={loadingFolders}
                            >
                                {availableFolders.map((folder, index) => (
                                    <option key={folder.path || `root-${index}`} value={folder.path}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    {folderError && <div className="error-message">{folderError}</div>}
                </div>

                {/* Upload New Model Section */}
                <div className="upload-section">
                    <input
                        type="file"
                        accept=".glb,.gltf" // Restrict to GLB and GLTF file types
                        onChange={(e) => setSelectedFile(e.target.files[0])} // Get the first selected file
                        disabled={uploading} // Disable during upload
                        className='upload'
                    />
                    {selectedFile && <p>Selected file: <strong>{selectedFile.name}</strong></p>}
                    <button
                        onClick={handleFileUpload}
                        className="nav-admin upload-button"
                        // Disable if no file selected, already uploading, or no folder selected
                        disabled={!selectedFile || uploading || !selectedFolder}
                    >
                        {uploading ? `Uploading (${uploadProgress.toFixed(0)}%)` : 'Upload Model'}
                    </button>

                    {/* Upload Progress Bar */}
                    {uploading && (
                        <div className="upload-progress-bar-container">
                            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}
                    {uploadError && <div className="error-message">{uploadError}</div>}
                    {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
                </div>

                {/* Model Viewer Section */}
                {selectedModelForViewer && (
                    <div className="model-viewer-container">
                        <div className="model-viewer-header">
                            <h3>
                                Viewing Model: <span>{selectedModelForViewer.substring(selectedModelForViewer.lastIndexOf('/') + 1).split('?')[0]}</span>
                                <span className="model-counter">
                                    ({currentModelIndex + 1} of {modelFiles.length})
                                </span>
                            </h3>
                            <div className="model-viewer-actions">
                                <button
                                    onClick={handleDeleteModel}
                                    className="nav-admin"
                                    disabled={deletingModel}
                                >

                                    {deletingModel ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={handleCloseViewer}
                                    className="nav-admin"
                                >

                                    Close
                                </button>
                            </div>
                        </div>

                        {deleteSuccess && <div className="success-message">{deleteSuccess}</div>}
                        {deleteError && <div className="error-message">{deleteError}</div>}

                        <div className="model-canvas-wrapper">
                            <Canvas camera={{ position: [-30, 50, -20], fov: 70 }}>
                                <ambientLight intensity={0.8} />
                                <directionalLight position={[10, 10, 5]} />
                                <Bounds fit clip observe margin={1.5}>
                                    <group rotation={[0, Math.PI, 0]}>
                                        <ClothingModel modelPath={selectedModelForViewer} meshColors={{}} />
                                    </group>
                                </Bounds>
                                <OrbitControls makeDefault />
                            </Canvas>

                            {/* Navigation buttons for viewer if more than one model */}
                            {modelFiles.length > 1 && (
                                <>
                                    <button
                                        onClick={() => navigateModelViewer('prev')}
                                        className="model-nav-button prev"
                                        aria-label="Previous Model"
                                    >
                                        <FiChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => navigateModelViewer('next')}
                                        className="model-nav-button next"
                                        aria-label="Next Model"
                                    >
                                        <FiChevronRight />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Models List */}
                <div className="models-list-container">


                    {loadingModels && (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <span>Loading models...</span>
                        </div>
                    )}

                    {modelFetchError && (
                        <div className="error-message">{modelFetchError}</div>
                    )}

                    {!loadingModels && modelFiles.length === 0 && !modelFetchError && (
                        <div className="empty-state">
                            <p>No models found in this location.</p>
                        </div>
                    )}

                    {!loadingModels && modelFiles.length > 0 && (
                        <div className="models-grid">
                            {modelFiles.map((modelUrl, index) => (
                                <div key={index} className="model-card">
                                    <div className="model-info">
                                        <span className="model-name">
                                            {/* Extract the file name from the URL */}
                                            {modelUrl.substring(modelUrl.lastIndexOf('/') + 1).split('?')[0]}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleViewModel(modelUrl, index)}
                                        className="nav-stylist"
                                    >
                                        View Model
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
