import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { storage, ref, listAll, getDownloadURL } from '../../../firebase.js'; 
import '../PageGlobal.css'; 

// Import Three.js components
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import ClothingModel from "../../ClothingModel.jsx"; // Adjust path if necessary

export default function StylistHomePage({ auth, api, setError, setSuccess, myClients }) {
    const [clientFoldersData, setClientFoldersData] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [foldersError, setFoldersError] = useState('');

    // New state for the model viewer:
    const [selectedClientForViewer, setSelectedClientForViewer] = useState(null); // Stores the client object whose models are being viewed
    const [selectedModelForViewer, setSelectedModelForViewer] = useState(null);   // Stores the URL of the current model in the viewer
    const [currentModelIndex, setCurrentModelIndex] = useState(-1);            // Stores the index of the current model in the client's models array

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

        for (const client of myClients) {
            if (client.user && client.user.email) {
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
                    models: models, // Array of download URLs
                    isOpen: false, // For collapsible section
                });
            }
        }
        setClientFoldersData(foldersData);
        setLoadingFolders(false);
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
        // Reset viewer when a different folder is opened or current one is closed
        setSelectedClientForViewer(null);
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    const handleViewModel = (clientFolder, modelUrl) => {
        setSelectedClientForViewer(clientFolder);
        setSelectedModelForViewer(modelUrl);
        // Find the index of the model within this client's models array
        const index = clientFolder.models.indexOf(modelUrl);
        setCurrentModelIndex(index);
    };

    const handleCloseViewer = () => {
        setSelectedClientForViewer(null);
        setSelectedModelForViewer(null);
        setCurrentModelIndex(-1);
    };

    const navigateModelViewer = (direction) => {
        if (!selectedClientForViewer || !selectedClientForViewer.models || selectedClientForViewer.models.length === 0) {
            return;
        }

        const totalModels = selectedClientForViewer.models.length;
        let newIndex = currentModelIndex;

        if (direction === 'next') {
            newIndex = (currentModelIndex + 1) % totalModels;
        } else if (direction === 'prev') {
            newIndex = (currentModelIndex - 1 + totalModels) % totalModels;
        }

        setSelectedModelForViewer(selectedClientForViewer.models[newIndex]);
        setCurrentModelIndex(newIndex);
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
                My Clients' Model Folders
            </motion.h1>

            <motion.div
                className='box'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                style={{ padding: '2rem' }}
            >
                {loadingFolders && (
                    <div className="text-center text-gray-400">Loading client folders...</div>
                )}
                {foldersError && (
                    <div className="text-red-500 text-center">{foldersError}</div>
                )}
                {!loadingFolders && clientFoldersData.length === 0 && !foldersError && (
                    <div className="text-center text-gray-400">No client folders found or you are not assigned to any clients.</div>
                )}

                {/* Model Viewer Section */}
                {selectedModelForViewer && selectedClientForViewer && (
                    <div className="model-viewer-section bg-gray-900 p-4 rounded-lg mb-6 relative">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold text-white">
                                Viewing: {selectedClientForViewer.clientName}'s Model (
                                {currentModelIndex + 1} of {selectedClientForViewer.models.length}
                                )
                            </h3>
                            <button
                                onClick={handleCloseViewer}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                            >
                                Close Viewer
                            </button>
                        </div>
                        <div style={{ height: '400px', width: '100%', backgroundColor: '#222', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Canvas camera={{ position: [-30, 50, -20], fov: 70 }}>
                                <ambientLight intensity={0.8} />
                                <directionalLight position={[10, 10, 5]} />
                                <Bounds fit clip observe margin={1.5}>
                                    <group rotation={[0, Math.PI, 0]}>
                                        {/* Pass meshColors as an empty object since we don't have per-mesh color customization here */}
                                        <ClothingModel modelPath={selectedModelForViewer} meshColors={{}} /> 
                                    </group>
                                </Bounds>
                                <OrbitControls makeDefault />
                            </Canvas>

                            {selectedClientForViewer.models.length > 1 && (
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

                {!loadingFolders && clientFoldersData.length > 0 && (
                    <div className="space-y-4">
                        {clientFoldersData.map((folder) => (
                            <div key={folder.clientId} className="border border-gray-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleFolder(folder.clientId)}
                                    className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 flex justify-between items-center text-lg font-medium text-white"
                                >
                                    <span>{folder.clientName} ({folder.clientEmail})</span>
                                    <span>{folder.isOpen ? '▲' : '▼'}</span>
                                </button>
                                {folder.isOpen && (
                                    <div className="p-4 bg-gray-800 border-t border-gray-700">
                                        <p className="text-gray-300 text-sm mb-2">Folder Path: `{folder.folderPath}`</p>
                                        {folder.hasModels ? (
                                            <div className="space-y-2">
                                                <h4 className="text-md font-semibold text-gray-200">Uploaded Models:</h4>
                                                {folder.models.map((modelUrl, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                                                        <span className="text-gray-200 text-sm truncate" title={modelUrl}>
                                                            {modelUrl.substring(modelUrl.lastIndexOf('/') + 1).split('?')[0]}
                                                        </span>
                                                        <div className="flex space-x-2 ml-4">
                                                            <button
                                                                onClick={() => handleViewModel(folder, modelUrl)}
                                                                className="text-sm bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded-md"
                                                            >
                                                                View Model
                                                            </button>
                                                            <Link
                                                                to={`/stylist/clients/${folder.clientId}`}
                                                                className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md"
                                                            >
                                                                Client Details
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic">No models uploaded for this client yet.</p>
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