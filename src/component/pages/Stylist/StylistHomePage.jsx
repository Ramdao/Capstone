import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { storage, ref, listAll, getDownloadURL } from '../../../firebase.js'; 
import '../PageGlobal.css'; 
import './StylistPage.css';
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import ClothingModel from "../../ClothingModel.jsx"; 
import { FiChevronDown, FiChevronUp, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function StylistHomePage({ auth, api, setError, setSuccess, myClients }) {
    const [clientFoldersData, setClientFoldersData] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [foldersError, setFoldersError] = useState('');
    const [selectedClientForViewer, setSelectedClientForViewer] = useState(null);
    const [selectedModelForViewer, setSelectedModelForViewer] = useState(null);
    const [currentModelIndex, setCurrentModelIndex] = useState(-1);

    const fetchClientModels = useCallback(async () => {
        if (!auth || auth.role !== 'stylist' || !myClients || myClients.length === 0) {
            setLoadingFolders(false);
            setClientFoldersData([]);
            setFoldersError('No clients assigned or not authorized.');
            return;
        }

        setLoadingFolders(true);
        setFoldersError('');
        const foldersData = [];

        try {
            await Promise.all(myClients.map(async (client) => {
                if (client.user?.email) {
                    const clientEmail = client.user.email;
                    const folderPath = `clients/${clientEmail}`;
                    const folderRef = ref(storage, folderPath);
                    let models = [];
                    let hasModels = false;

                    try {
                        const folderList = await listAll(folderRef);
                        const gltfItems = folderList.items.filter(item =>
                            item.name.toLowerCase().endsWith('.glb') || item.name.toLowerCase().endsWith('.gltf')
                        );

                        if (gltfItems.length > 0) {
                            hasModels = true;
                            models = await Promise.all(
                                gltfItems.map(item => getDownloadURL(item))
                            );
                        }
                    } catch (err) {
                        console.error(`Error listing files for client ${clientEmail}:`, err);
                    }

                    foldersData.push({
                        clientId: client.id,
                        clientName: client.user.name || 'Unknown Client',
                        clientEmail: clientEmail,
                        folderPath: folderPath,
                        hasModels: hasModels,
                        models: models,
                        isOpen: false,
                    });
                }
            }));
            
            setClientFoldersData(foldersData);
        } catch (error) {
            setFoldersError('Failed to load client data. Please try again.');
            console.error('Error fetching client models:', error);
        } finally {
            setLoadingFolders(false);
        }
    }, [auth, myClients]);

    useEffect(() => {
        fetchClientModels();
    }, [fetchClientModels]);

    const toggleFolder = (clientId) => {
        setClientFoldersData(prevData =>
            prevData.map(folder =>
                folder.clientId === clientId ? { ...folder, isOpen: !folder.isOpen } : folder
            )
        );
        setSelectedClientForViewer(null);
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    const handleViewModel = (clientFolder, modelUrl) => {
        setSelectedClientForViewer(clientFolder);
        setSelectedModelForViewer(modelUrl);
        setCurrentModelIndex(clientFolder.models.indexOf(modelUrl));
    };

    const handleCloseViewer = () => {
        setSelectedClientForViewer(null);
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    const navigateModelViewer = (direction) => {
        if (!selectedClientForViewer?.models?.length) return;

        const totalModels = selectedClientForViewer.models.length;
        let newIndex = direction === 'next' 
            ? (currentModelIndex + 1) % totalModels
            : (currentModelIndex - 1 + totalModels) % totalModels;

        setSelectedModelForViewer(selectedClientForViewer.models[newIndex]);
        setCurrentModelIndex(newIndex);
    };

    return (
        <div className="stylist-page-container">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className="page-title">My Clients' 3D Models</h1>
                <p className="page-subtitle">View and manage your clients' clothing models</p>
            </motion.div>

            <motion.div
                className="content-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
                {/* Status Messages */}
                {loadingFolders && (
                    <div className="loading-indicator">
                        <div className="spinner"></div>
                        <span>Loading client folders...</span>
                    </div>
                )}
                
                {foldersError && (
                    <div className="error-message">
                        <span>{foldersError}</span>
                    </div>
                )}
                
                {!loadingFolders && clientFoldersData.length === 0 && !foldersError && (
                    <div className="empty-state">
                        <p>No client folders found or you are not assigned to any clients.</p>
                        <Link to="/stylist/clients" className="action-button">
                            Manage Clients
                        </Link>
                    </div>
                )}

                {/* Model Viewer Section */}
                {selectedModelForViewer && selectedClientForViewer && (
                    <div className="model-viewer-container">
                        <div className="model-viewer-header">
                            <h3>
                                Viewing: <span>{selectedClientForViewer.clientName}</span>
                                <span className="model-counter">
                                    ({currentModelIndex + 1} of {selectedClientForViewer.models.length})
                                </span>
                            </h3>
                            <button 
                                onClick={handleCloseViewer}
                                className="close-viewer-button"
                                aria-label="Close model viewer"
                            >
                                <FiX />
                            </button>
                        </div>
                        
                        <div className="model-canvas-container">
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

                            {selectedClientForViewer.models.length > 1 && (
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

                {/* Client Folders List */}
                {!loadingFolders && clientFoldersData.length > 0 && (
                    <div className="client-folders-list">
                        {clientFoldersData.map((folder) => (
                            <div key={folder.clientId} className="client-folder">
                                <button
                                    onClick={() => toggleFolder(folder.clientId)}
                                    className={`folder-toggle ${folder.isOpen ? 'open' : ''}`}
                                    aria-expanded={folder.isOpen}
                                >
                                    <div className="client-info">
                                        <span className="client-name">{folder.clientName}</span>
                                        <span className="client-email">{folder.clientEmail}</span>
                                    </div>
                                    {folder.isOpen ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                                
                                {folder.isOpen && (
                                    <div className="folder-content">
                                        {folder.hasModels ? (
                                            <div className="model-list">
                                                <h4>Available Models</h4>
                                                <div className="model-items">
                                                    {folder.models.map((modelUrl, idx) => (
                                                        <div key={idx} className="model-item">
                                                            <div className="model-info">
                                                                <span className="model-name">
                                                                    {modelUrl.substring(modelUrl.lastIndexOf('/') + 1).split('?')[0]}
                                                                </span>
                                                            </div>
                                                            <div className="model-actions">
                                                                <button
                                                                    onClick={() => handleViewModel(folder, modelUrl)}
                                                                    className="view-model-button"
                                                                >
                                                                    View 3D Model
                                                                </button>
                                                                <Link
                                                                    to={`/stylist/clients/${folder.clientId}`}
                                                                    className="client-details-button"
                                                                >
                                                                    Client Details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="no-models-message">
                                                <p>No models uploaded for this client yet.</p>
                                                <Link 
                                                    to={`/stylist/clients/${folder.clientId}`}
                                                    className="upload-prompt-button"
                                                >
                                                    Upload Models
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}