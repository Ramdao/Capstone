// src/pages/Admin/AdminHomePage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { storage, ref, listAll, getDownloadURL, deleteObject } from '../../../firebase.js'; 
import '../PageGlobal.css';

// Import Three.js components
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

    // --- Fetching All Folders (Public & Client) ---
    const fetchAllFolders = useCallback(async () => {
        if (!auth || auth.role !== 'admin') {
            setFolderError('Unauthorized access.');
            setLoadingFolders(false);
            return;
        }

        setLoadingFolders(true);
        setFolderError(null);
        let folders = [
            { path: "", name: "Root" }, // Represents the root of the storage
            { path: "publicModels/", name: "Public Models" }
        ];

        try {
            // List prefixes under 'clients/' to find client email folders
            const clientsFolderRef = ref(storage, 'clients/');
            const clientsList = await listAll(clientsFolderRef);

            clientsList.prefixes.forEach(prefixRef => {
                // prefixRef.fullPath will be 'clients/username@email.com/'
                // We want the dropdown name to be just the email
                const emailFolderName = prefixRef.name; // e.g., 'username@email.com'
                folders.push({
                    path: prefixRef.fullPath + '/', // Ensure trailing slash for consistent folder path
                    name: `Client: ${emailFolderName}`
                });
            });

            setAvailableFolders(folders);
            // Default to 'publicModels' or the first available if publicModels isn't present
            setSelectedFolder(folders.length > 1 ? folders[1].path : folders[0].path);

        } catch (error) {
            console.error("Error fetching all Firebase folders:", error);
            setFolderError("Failed to load folders. Please try again.");
        } finally {
            setLoadingFolders(false);
        }
    }, [auth]);

    useEffect(() => {
        fetchAllFolders();
    }, [fetchAllFolders]);

    // --- Fetching Models in Selected Folder ---
    const fetchModelsInFolder = useCallback(async () => {
        if (!selectedFolder && selectedFolder !== "") {
            setModelFiles([]);
            setSelectedModelForViewer(null);
            setCurrentModelIndex(-1);
            return;
        }

        setLoadingModels(true);
        setModelFetchError(null);
        setDeleteSuccess(null); // Clear previous delete messages
        setDeleteError(null);

        try {
            const folderRef = ref(storage, selectedFolder);
            const folderList = await listAll(folderRef);

            const allUrls = await Promise.all(
                folderList.items
                    .filter(item => item.name.toLowerCase().endsWith('.glb') || item.name.toLowerCase().endsWith('.gltf'))
                    .map(item => getDownloadURL(item))
            );

            setModelFiles(allUrls);
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
    }, [selectedFolder]);

    useEffect(() => {
        fetchModelsInFolder();
    }, [fetchModelsInFolder]);

    // --- Model Viewer Navigation ---
    const handleViewModel = (modelUrl, index) => {
        setSelectedModelForViewer(modelUrl);
        setCurrentModelIndex(index);
    };

    const navigateModelViewer = (direction) => {
        if (!modelFiles.length) return;

        const totalModels = modelFiles.length;
        let newIndex = currentModelIndex;

        if (direction === 'next') {
            newIndex = (currentModelIndex + 1) % totalModels;
        } else if (direction === 'prev') {
            newIndex = (currentModelIndex - 1 + totalModels) % totalModels;
        }

        setSelectedModelForViewer(modelFiles[newIndex]);
        setCurrentModelIndex(newIndex);
    };

    const handleCloseViewer = () => {
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    // --- Delete Model Functionality ---
    const handleDeleteModel = async () => {
        if (!selectedModelForViewer || !auth || auth.role !== 'admin') {
            setDeleteError("No model selected or unauthorized to delete.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this model?\n${selectedModelForViewer.substring(selectedModelForViewer.lastIndexOf('/') + 1).split('?')[0]}`)) {
            return; // User cancelled
        }

        setDeletingModel(true);
        setDeleteError(null);
        setDeleteSuccess(null);

        try {
            // Get the storage reference from the download URL
            const modelRef = ref(storage, selectedModelForViewer);
            await deleteObject(modelRef);

            setDeleteSuccess("Model deleted successfully!");
            // Remove the deleted model from the local state
            const updatedModelFiles = modelFiles.filter(url => url !== selectedModelForViewer);
            setModelFiles(updatedModelFiles);

            // Update viewer if the deleted model was the current one
            if (updatedModelFiles.length > 0) {
                const newIndex = currentModelIndex >= updatedModelFiles.length ? updatedModelFiles.length - 1 : currentModelIndex;
                setSelectedModelForViewer(updatedModelFiles[newIndex]);
                setCurrentModelIndex(newIndex);
            } else {
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

    // Style for the navigation arrows within the model viewer
    const viewerArrowStyle = {
        background: "rgba(0,0,0,0.3)",
        border: "none",
        fontSize: "2rem",
        color: "white",
        cursor: "pointer",
        zIndex: 2,
        userSelect: "none",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(5px)",
        transition: "all 0.3s ease",
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
    };


    return (
        <div className='pagelayout'>
            <motion.h1
                className='about-heading'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                Admin Dashboard - All Models
            </motion.h1>

            <motion.div
                className='box'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                style={{ padding: '2rem' }}
            >
                {/* Folder Selection Dropdown */}
                <div className="mb-6 p-4 bg-gray-700 rounded-lg flex items-center justify-center gap-4 flex-wrap">
                    <label htmlFor="admin-folder-select" className="text-white text-lg font-semibold">Select Folder:</label>
                    <select
                        id="admin-folder-select"
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        value={selectedFolder}
                        className="p-2 rounded-md bg-gray-800 text-white border border-gray-600 cursor-pointer text-base"
                        disabled={loadingFolders}
                    >
                        {loadingFolders ? (
                            <option value="">Loading folders...</option>
                        ) : folderError ? (
                            <option value="">Error loading folders</option>
                        ) : (
                            availableFolders.map((folder, index) => (
                                <option key={folder.path || `root-${index}`} value={folder.path}>
                                    {folder.name}
                                </option>
                            ))
                        )}
                    </select>
                    {folderError && <div className="text-red-400 text-sm w-full text-center mt-2">{folderError}</div>}
                </div>

                {/* Model Viewer Section */}
                {selectedModelForViewer && (
                    <div className="model-viewer-section bg-gray-900 p-4 rounded-lg mb-6 relative">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold text-white">
                                Viewing Model ({currentModelIndex + 1} of {modelFiles.length})
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteModel}
                                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingModel}
                                >
                                    {deletingModel ? 'Deleting...' : 'Delete Model'}
                                </button>
                                <button
                                    onClick={handleCloseViewer}
                                    className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700"
                                >
                                    Close Viewer
                                </button>
                            </div>
                        </div>

                        {deleteSuccess && <div className="text-green-400 mb-3 text-center">{deleteSuccess}</div>}
                        {deleteError && <div className="text-red-400 mb-3 text-center">{deleteError}</div>}

                        <div style={{ height: '400px', width: '100%', backgroundColor: '#222', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                            {modelFiles.length > 1 && (
                                <>
                                    <button
                                        onClick={() => navigateModelViewer('prev')}
                                        style={{ ...viewerArrowStyle, left: "20px" }}
                                        aria-label="Previous Model"
                                    >
                                        &lt;
                                    </button>
                                    <button
                                        onClick={() => navigateModelViewer('next')}
                                        style={{ ...viewerArrowStyle, right: "20px" }}
                                        aria-label="Next Model"
                                    >
                                        &gt;
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* List of Models in Selected Folder */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Models in `{selectedFolder || "Root"}`</h3>
                    {loadingModels && <div className="text-center text-gray-400">Loading models...</div>}
                    {modelFetchError && <div className="text-red-400 text-center">{modelFetchError}</div>}

                    {!loadingModels && modelFiles.length === 0 && !modelFetchError && (
                        <p className="text-gray-400 italic text-center">No models found in this folder.</p>
                    )}

                    {!loadingModels && modelFiles.length > 0 && (
                        <div className="space-y-3">
                            {modelFiles.map((modelUrl, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                                    <span className="text-gray-200 text-sm truncate" title={modelUrl}>
                                        {modelUrl.substring(modelUrl.lastIndexOf('/') + 1).split('?')[0]}
                                    </span>
                                    <button
                                        onClick={() => handleViewModel(modelUrl, index)}
                                        className="ml-4 text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md"
                                    >
                                        View
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