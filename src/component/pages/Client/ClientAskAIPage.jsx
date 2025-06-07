// src/pages/Client/ClientAskAIPage.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from 'three';

import '../PageGlobal.css';
import '../../Modelcontainer.css'; 
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

    const arrowStyle = {
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
    };

    return (
        <div className="pagelayout" style={{ 
            backgroundColor: "#1a1a1a", 
            color: "white", 
            minHeight: "100vh",
            padding: "2rem",
            maxWidth: "1400px",
            margin: "0 auto"
        }}>
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <h1 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: '600', 
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(90deg, #ffffff, #aaaaaa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    AI Color Generator
                </h1>
                <p style={{ 
                    fontSize: '1.1rem', 
                    color: '#aaa',
                    maxWidth: '700px',
                    margin: '0 auto'
                }}>
                    Describe your ideal color and see it applied to your 3D model in real-time
                </p>
            </motion.div>

            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr',
                gap: '2rem',
                alignItems: 'start'
            }}>
                {/* Left Column - AI Controls */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{ 
                        background: 'linear-gradient(145deg, #222222, #1a1a1a)',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        height: '100%'
                    }}
                >
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ 
                            fontSize: '1.5rem', 
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ color: '#4dabf7' }}>1.</span> Describe Your Color
                        </h2>
                        <input
                            type="text"
                            value={colorPrompt}
                            onChange={(e) => setColorPrompt(e.target.value)}
                            placeholder="e.g., 'sunset orange', 'deep ocean blue', 'earthy green'"
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                width: '100%',
                                marginBottom: '1rem',
                                fontSize: '1em',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4dabf7'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        
                        <motion.button
                            onClick={generateColor}
                            disabled={loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(90deg, #4dabf7, #339af0)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1em',
                                fontWeight: '500',
                                width: '100%',
                                transition: 'all 0.3s ease',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
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
                            style={{ marginTop: '2rem' }}
                        >
                            <h2 style={{ 
                                fontSize: '1.5rem', 
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ color: '#4dabf7' }}>2.</span> Your Generated Color
                            </h2>
                            
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        backgroundColor: generatedColor,
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        boxShadow: `0 4px 20px ${generatedColor}80`,
                                        flexShrink: 0
                                    }}
                                ></div>
                                <div>
                                    <p style={{ 
                                        fontSize: '1.1rem', 
                                        fontWeight: '500',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {colorPrompt || 'Random color'}
                                    </p>
                                    <p style={{ 
                                        fontSize: '1.4rem', 
                                        fontWeight: '600',
                                        color: generatedColor
                                    }}>
                                        {generatedColor}
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                onClick={handleSaveColor}
                                disabled={!generatedColor || auth?.role !== 'client' || !updateClientProfile}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(90deg, #40c057, #37b24d)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1em',
                                    fontWeight: '500',
                                    width: '100%',
                                    transition: 'all 0.3s ease',
                                    opacity: (!generatedColor || !auth?.client || !updateClientProfile) ? 0.6 : 1
                                }}
                            >
                                Save to My Colors
                            </motion.button>
                            
                            {saveStatus && (
                                <p style={{ 
                                    marginTop: '1rem', 
                                    fontSize: '0.9em', 
                                    color: saveStatus.includes('Failed') || saveStatus.includes('Error') ? '#ff6b6b' : '#69db7c',
                                    textAlign: 'center'
                                }}>
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
                    style={{
                        position: 'relative',
                        background: 'linear-gradient(145deg, #222222, #1a1a1a)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        aspectRatio: '1/1',
                        minHeight: '500px'
                    }}
                >
                    {modelLoading && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 10
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    borderTopColor: '#4dabf7',
                                    borderRadius: '50%',
                                    margin: '0 auto 1rem',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <p style={{ fontSize: "1.2rem", color: "white" }}>Loading 3D model...</p>
                            </div>
                        </div>
                    )}
                    
                    {modelError && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 10,
                            padding: '2rem',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: "#ff6b6b", fontSize: "1.2rem" }}>{modelError}</p>
                        </div>
                    )}

                    {!modelLoading && !modelError && modelFiles.length === 0 && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 10
                        }}>
                            <p style={{ fontSize: "1.2rem", color: "#aaa" }}>No 3D models available</p>
                        </div>
                    )}

                    {!modelLoading && !modelError && selectedModel && (
                        <>
                            {modelFiles.length > 1 && (
                                <>
                                    <button 
                                        onClick={prevModel} 
                                        style={{ 
                                            ...arrowStyle, 
                                            position: "absolute", 
                                            left: "20px",
                                            top: "50%",
                                            transform: "translateY(-50%)"
                                        }} 
                                        aria-label="Previous Model"
                                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                                    >
                                        &lt;
                                    </button>
                                    <button 
                                        onClick={nextModel} 
                                        style={{ 
                                            ...arrowStyle, 
                                            position: "absolute", 
                                            right: "20px",
                                            top: "50%",
                                            transform: "translateY(-50%)"
                                        }} 
                                        aria-label="Next Model"
                                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                                    >
                                        &gt;
                                    </button>
                                </>
                            )}

                            <Canvas 
                                camera={{ position: [-30, 50, -20], fov: 70 }} 
                                style={{ width: '100%', height: '100%' }}
                            >
                                <ambientLight intensity={0.8} />
                                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                                <Bounds fit clip observe margin={1.5}>
                                    <group rotation={[0, Math.PI, 0]}>
                                        <ClothingModel
                                            modelPath={selectedModel}
                                            uniformColor={generatedColor || "#FFFFFF"}
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

                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.5)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                backdropFilter: 'blur(5px)'
                            }}>
                                Model {modelFiles.indexOf(selectedModel) + 1} of {modelFiles.length}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Global styles for animations */}
            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}