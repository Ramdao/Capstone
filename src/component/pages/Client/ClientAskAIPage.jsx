// src/pages/Client/ClientAskAIPage.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei"; 
import * as THREE from 'three'; 

import '../PageGlobal.css'; 
import './ClientAskAIPage.css'; 
import ClothingModel from '../../ClothingModel.jsx'; 
import { storage, ref, listAll, getDownloadURL } from '../../../firebase.js'; 
import { AuthContext } from '../../../AuthContext'; 

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function ClientAskAIPage() {
    const { auth, updateClientProfile, setError, setSuccess, fetchAuthenticatedUser } = useContext(AuthContext); 

    // State for AI color generation
    const [generatedColor, setGeneratedColor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [colorPrompt, setColorPrompt] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    // State for 3D model display
    const [modelFiles, setModelFiles] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [modelLoading, setModelLoading] = useState(true);
    const [modelError, setModelError] = useState(null);

    // Firebase Model Fetching Logic (same as before)
    useEffect(() => {
        const fetchModels = async () => {
            setModelLoading(true);
            setModelError(null);
            const defaultModelFolder = "clients/defaultUser";

            try {
                const folderRef = ref(storage, defaultModelFolder);
                const folderList = await listAll(folderRef);

                const gltfItems = folderList.items.filter(item =>
                    item.name.endsWith('.gltf') || item.name.endsWith('.glb')
                );

                const allUrls = await Promise.all(
                    gltfItems.map(item => getDownloadURL(item))
                );

                setModelFiles(allUrls);
                if (allUrls.length > 0) {
                    setSelectedModel(allUrls[0]);
                } else {
                    setModelError(`No 3D models found in the default folder.`);
                }
            } catch (err) {
                console.error('Error fetching models:', err);
                setModelError(`Failed to load models: ${err.message}`);
                setModelFiles([]);
                setSelectedModel(null);
            } finally {
                setModelLoading(false);
            }
        };

        fetchModels();
    }, []);

    // OpenAI Color Generation Logic (same as before)
    const generateColor = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setGeneratedColor(null);
        setSaveStatus('');

        if (!OPENAI_API_KEY) {
            setError('OpenAI API Key is not configured.');
            setLoading(false);
            return;
        }

        try {
            const messages = [
                { role: "system", content: "You are a helpful assistant that generates hex color codes based on descriptions. Only respond with the 6-digit hex code, including the '#' prefix. Do not include any other text, explanations, or punctuation." },
                { role: "user", content: `Generate a hex color code for: ${colorPrompt || 'a random color'}.` }
            ];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messages,
                    max_tokens: 10,
                    temperature: 0.7,
                    response_format: { type: "text" }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error from OpenAI'}`);
            }

            const data = await response.json();
            const hexCode = data.choices[0].message.content.trim();

            if (/^#[0-9A-Fa-f]{6}$/.test(hexCode)) {
                setGeneratedColor(hexCode);
                setSuccess('Color generated successfully!');
            } else {
                const extractedHex = hexCode.match(/#[0-9A-Fa-f]{6}/);
                if (extractedHex && extractedHex[0]) {
                    setGeneratedColor(extractedHex[0]);
                    setSuccess('Color generated successfully!');
                } else {
                    setError(`AI did not return a valid hex code: "${hexCode}". Please try again.`);
                }
            }

        } catch (err) {
            console.error('Error generating color:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Save Color to Profile Logic (same as before)
    const handleSaveColor = async () => {
        if (!generatedColor) {
            setSaveStatus('No color has been generated yet.');
            return;
        }

        if (!auth || auth.role !== 'client' || !auth.client || !updateClientProfile) {
            setSaveStatus('Error: You must be logged in as a client to save colors.');
            setError('Please log in as a client to save colors.');
            return;
        }

        setSaveStatus('Saving color to profile...');
        setSuccess('');
        setError('');

        try {
            let currentColors = auth.client.colors;
            let colorsArray = [];

            if (Array.isArray(currentColors)) {
                colorsArray = [...currentColors];
            } else if (typeof currentColors === 'string' && currentColors.trim() !== '') {
                try {
                    colorsArray = JSON.parse(currentColors);
                    if (!Array.isArray(colorsArray)) {
                        colorsArray = currentColors.split(',').map(c => c.trim()).filter(Boolean);
                    }
                } catch (parseError) {
                    colorsArray = currentColors.split(',').map(c => c.trim()).filter(Boolean);
                }
            }
            
            if (!colorsArray.includes(generatedColor)) {
                colorsArray.push(generatedColor);
            } else {
                setSaveStatus('Color is already in your favorites!');
                return;
            }

            await updateClientProfile({ colors: colorsArray }); 
            setSaveStatus('Color saved successfully!');
            setSuccess('Color added to your profile!');

        } catch (err) {
            console.error('Error saving color to profile:', err);
            setSaveStatus(`Failed to save color: ${err.message || 'An unexpected error occurred.'}`);
            setError(`Failed to save color: ${err.message || 'An error occurred.'}`);
        }
    };

    // Model Navigation Logic (same as before)
    const nextModel = () => {
        if (!modelFiles.length) return;
        const currentIndex = modelFiles.indexOf(selectedModel);
        const nextIndex = (currentIndex + 1) % modelFiles.length;
        setSelectedModel(modelFiles[nextIndex]);
    };

    const prevModel = () => {
        if (!modelFiles.length) return;
        const currentIndex = modelFiles.indexOf(selectedModel);
        const prevIndex = (currentIndex - 1 + modelFiles.length) % modelFiles.length;
        setSelectedModel(modelFiles[prevIndex]);
    };

    // Note: arrowStyle is now handled by CSS classes for better maintainability

    return (
        <div className="client-ai-page-layout">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1>
                    AI Color Generator
                </h1>
                <p>
                    Describe your ideal color and see it applied to your 3D model in real-time.
                </p>
            </motion.div>

            {/* Main Content Grid */}
            <div className="ai-content-grid">
                {/* Left Column - AI Controls */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="ai-controls-column"
                >
                    <div style={{ marginBottom: '2rem' }}>
                        <h2>
                            Describe Your Color
                        </h2>
                        <input
                            type="text"
                            value={colorPrompt}
                            onChange={(e) => setColorPrompt(e.target.value)}
                            placeholder="e.g., 'sunset orange', 'deep ocean blue', 'earthy green'"
                            className="ai-color-input"
                        />
                        
                        <motion.button
                            onClick={generateColor}
                            disabled={loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="ai-button"
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <div className="ai-spinner"></div>
                                    Generating...
                                </span>
                            ) : (
                                'Generate Color'
                            )}
                        </motion.button>
                    </div>

                    {generatedColor && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{ marginTop: '5rem' }}
                        >
                            <h2>
                                Your Generated Color
                            </h2>
                            
                            <div className="generated-color-display">
                                <div
                                    className="color-swatch"
                                    style={{ backgroundColor: generatedColor }}
                                ></div>
                                <div className="color-details">
                                    <p>
                                        {colorPrompt || 'Random color'}
                                    </p>
                                    <p>
                                        {generatedColor}
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                onClick={handleSaveColor}
                                disabled={!generatedColor || auth?.role !== 'client' || !updateClientProfile}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="ai-button"
                                style={{ marginTop: '1.5rem' }}
                            >
                                Save to My Colors
                            </motion.button>
                            
                            {saveStatus && (
                                <p className="color-status-message">
                                    {saveStatus}
                                </p>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                {/* Right Column - 3D Model Viewer */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="model-viewer-column"
                >
                    {modelLoading && (
                        <div className="model-status-message">
                            <div className="ai-spinner"></div>
                            <p>Loading 3D model...</p>
                        </div>
                    )}
                    
                    {modelError && (
                        <div className="model-status-message">
                            <p>{modelError}</p>
                        </div>
                    )}

                    {!modelLoading && !modelError && modelFiles.length === 0 && (
                        <div className="model-status-message">
                            <p>No 3D models available</p>
                        </div>
                    )}

                    {!modelLoading && !modelError && selectedModel && (
                        <>
                            {modelFiles.length > 1 && (
                                <>
                                    <motion.button 
                                        onClick={prevModel} 
                                        className="model-nav-button prev"
                                        aria-label="Previous Model"
                                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                                    >
                                        &lt;
                                    </motion.button>
                                    <motion.button 
                                        onClick={nextModel} 
                                        className="model-nav-button next"
                                        aria-label="Next Model"
                                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                                    >
                                        &gt;
                                    </motion.button>
                                </>
                            )}

                            <Canvas 
                                camera={{ position: [-30, 50, -20], fov: 70 }} 
                                className="model-viewer-canvas-wrapper" // Apply the wrapper style here
                            >
                                <ambientLight intensity={0.8} />
                                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                                <Bounds fit clip observe margin={1.5}>
                                    <group rotation={[0, Math.PI, 0]}>
                                        <ClothingModel
                                            modelPath={selectedModel}
                                            uniformColor={generatedColor || "#FFFFFF"} // Pass generatedColor
                                        />
                                    </group>
                                </Bounds>
                                <OrbitControls 
                                    makeDefault 
                                    enablePan={true}
                                    enableZoom={true}
                                    enableRotate={true}
                                />
                            </Canvas>

                            <div className="model-index-display">
                                Model {modelFiles.indexOf(selectedModel) + 1} of {modelFiles.length}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}