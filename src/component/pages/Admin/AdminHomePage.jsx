import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { storage, ref, listAll, getDownloadURL, deleteObject } from '../../../firebase.js'; 
import { FiChevronDown, FiChevronUp, FiX, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import '../PageGlobal.css';
import './AdminHomePage.css';

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

    const fetchAllFolders = useCallback(async () => {
        if (!auth || auth.role !== 'admin') {
            setFolderError('Unauthorized access.');
            setLoadingFolders(false);
            return;
        }

        setLoadingFolders(true);
        setFolderError(null);
        let folders = [
            { path: "", name: "Root" },
            { path: "publicModels/", name: "Public Models" }
        ];

        try {
            const clientsFolderRef = ref(storage, 'clients/');
            const clientsList = await listAll(clientsFolderRef);

            clientsList.prefixes.forEach(prefixRef => {
                const emailFolderName = prefixRef.name;
                folders.push({
                    path: prefixRef.fullPath + '/',
                    name: `Client: ${emailFolderName}`
                });
            });

            setAvailableFolders(folders);
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

    const fetchModelsInFolder = useCallback(async () => {
        if (!selectedFolder && selectedFolder !== "") {
            setModelFiles([]);
            setSelectedModelForViewer(null);
            setCurrentModelIndex(-1);
            return;
        }

        setLoadingModels(true);
        setModelFetchError(null);
        setDeleteSuccess(null);
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

    const handleViewModel = (modelUrl, index) => {
        setSelectedModelForViewer(modelUrl);
        setCurrentModelIndex(index);
    };

    const navigateModelViewer = (direction) => {
        if (!modelFiles.length) return;

        const totalModels = modelFiles.length;
        let newIndex = direction === 'next' 
            ? (currentModelIndex + 1) % totalModels
            : (currentModelIndex - 1 + totalModels) % totalModels;

        setSelectedModelForViewer(modelFiles[newIndex]);
        setCurrentModelIndex(newIndex);
    };

    const handleCloseViewer = () => {
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    const handleDeleteModel = async () => {
        if (!selectedModelForViewer || !auth || auth.role !== 'admin') {
            setDeleteError("No model selected or unauthorized to delete.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this model?\n${selectedModelForViewer.substring(selectedModelForViewer.lastIndexOf('/') + 1).split('?')[0]}`)) {
            return;
        }

        setDeletingModel(true);
        setDeleteError(null);
        setDeleteSuccess(null);

        try {
            const modelRef = ref(storage, selectedModelForViewer);
            await deleteObject(modelRef);

            setDeleteSuccess("Model deleted successfully!");
            const updatedModelFiles = modelFiles.filter(url => url !== selectedModelForViewer);
            setModelFiles(updatedModelFiles);

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

    return (
        <div className="admin-page-container">
            <motion.div
                className="admin-page-header"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1>Admin Dashboard</h1>
                <p>Manage all 3D models in the system</p>
            </motion.div>

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
                            <p>No models found in this location</p>
                        </div>
                    )}

                    {!loadingModels && modelFiles.length > 0 && (
                        <div className="models-grid">
                            {modelFiles.map((modelUrl, index) => (
                                <div key={index} className="model-card">
                                    <div className="model-info">
                                        <span className="model-name">
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