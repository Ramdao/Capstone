// src/pages/ClientAskAIPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei"; // Added useGLTF for simplicity, though ClothingModel uses it
import * as THREE from 'three'; // Import Three.js for materials

import '../PageGlobal.css';
import '../../Modelcontainer.css'; // Assuming you might want some styles from here

import ClothingModel from '../../ClothingModel.jsx'; // Path to your ClothingModel component
import { storage, ref, listAll, getDownloadURL } from '../../../firebase.js'; // Adjust Firebase path as needed

// Your OpenAI API Key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function ClientAskAIPage() {
    // State for AI color generation
    const [generatedColor, setGeneratedColor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [colorPrompt, setColorPrompt] = useState(''); // State for user's color request

    // State for 3D model display
    const [modelFiles, setModelFiles] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [modelLoading, setModelLoading] = useState(true);
    const [modelError, setModelError] = useState(null);

    // --- Firebase Model Fetching Logic ---
    useEffect(() => {
        const fetchModels = async () => {
            setModelLoading(true);
            setModelError(null);
            // Define the default folder where your models are stored
            // This is just an example. Adjust to your specific Firebase Storage structure.
            const defaultModelFolder = "clients/defaultUser"; // Or "", "publicModels", etc.

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
                    setSelectedModel(allUrls[0]); // Select the first model found
                } else {
                    setModelError(`No .gltf or .glb models found in folder: '${defaultModelFolder}'.`);
                }
            } catch (err) {
                console.error(`Error fetching models from Firebase folder '${defaultModelFolder}':`, err);
                setModelError(`Failed to load models: ${err.message}`);
                setModelFiles([]);
                setSelectedModel(null);
            } finally {
                setModelLoading(false);
            }
        };

        fetchModels();
    }, []); // Empty dependency array means this runs once on mount

    // --- OpenAI Color Generation Logic ---
    const generateColor = async () => {
        setLoading(true);
        setError(null);
        setGeneratedColor(null);

        if (!OPENAI_API_KEY) {
            setError('OpenAI API Key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
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
            } else {
                const extractedHex = hexCode.match(/#[0-9A-Fa-f]{6}/);
                if (extractedHex && extractedHex[0]) {
                    setGeneratedColor(extractedHex[0]);
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

    // --- Model Navigation Logic ---
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
        background: "transparent",
        border: "none",
        fontSize: "3rem",
        color: "#fff",
        cursor: "pointer",
        zIndex: 2,
        userSelect: "none",
    };


    return (
        <div className="pagelayout" style={{ backgroundColor: "#1a1a1a", color: "white", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <motion.h1
                className="about-heading"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ textAlign: 'center', padding: '20px 0' }}
            >
                Ask AI to Generate a Color for Your Model
            </motion.h1>

            {/* AI Color Generation Section */}
            <motion.div
                className="box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                style={{ padding: '20px', textAlign: 'center', marginBottom: '20px', background: '#333', borderRadius: '10px' }}
            >
                <p style={{ marginBottom: '15px', fontSize: '1.1em' }}>Enter a description for the color you'd like the model to be:</p>
                <input
                    type="text"
                    value={colorPrompt}
                    onChange={(e) => setColorPrompt(e.target.value)}
                    placeholder="e.g., 'a vibrant ocean blue', 'a subtle pastel pink', 'a dark gothic red'"
                    style={{
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        width: '80%',
                        maxWidth: '400px',
                        marginBottom: '15px',
                        fontSize: '1em',
                        background: '#555',
                        color: 'white'
                    }}
                />
                <motion.button
                    onClick={generateColor}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '1em'
                    }}
                >
                    {loading ? 'Generating...' : 'Generate Color'}
                </motion.button>

                {error && (
                    <p style={{ color: 'red', marginTop: '20px' }}>Error: {error}</p>
                )}

                {generatedColor && (
                    <div style={{ marginTop: '30px' }}>
                        <p>Generated Color:</p>
                        <div
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                backgroundColor: generatedColor,
                                margin: '15px auto',
                                border: '2px solid #555',
                                boxShadow: '0 0 15px rgba(0,0,0,0.3)'
                            }}
                        ></div>
                        <p style={{ fontWeight: 'bold', fontSize: '1.2em', color: generatedColor }}>
                            {generatedColor}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* 3D Model Viewer Section */}
            <div className="model-container" style={{ flex: 1, minHeight: '500px', position: 'relative', background: '#222', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {modelLoading && <p style={{ fontSize: "1.2rem", color: "#aaa" }}>Loading 3D models...</p>}
                {modelError && <p style={{ color: "red", fontSize: "1.2rem" }}>{modelError}</p>}

                {!modelLoading && !modelError && modelFiles.length === 0 && (
                     <p style={{ fontSize: "1.2rem", color: "#aaa" }}>No 3D models available in the specified Firebase folder.</p>
                )}

                {!modelLoading && !modelError && selectedModel && (
                    <>
                        {modelFiles.length > 1 && (
                            <button onClick={prevModel} style={{ ...arrowStyle, position: "absolute", left: "10px" }} aria-label="Previous Model">&lt;</button>
                        )}

                        <Canvas camera={{ position: [-30, 50, -20], fov: 70 }} style={{ flex: 1 }}>
                            <ambientLight intensity={0.8} />
                            <directionalLight position={[10, 10, 5]} />
                            <Bounds fit clip observe margin={1.5}>
                                <group rotation={[0, Math.PI, 0]}>
                                    {/* Pass the generatedColor as uniformColor to the ClothingModel */}
                                    <ClothingModel
                                        modelPath={selectedModel}
                                        uniformColor={generatedColor || "#FFFFFF"} // Default to white if no color generated yet
                                    />
                                </group>
                            </Bounds>
                            <OrbitControls makeDefault />
                        </Canvas>

                        {modelFiles.length > 1 && (
                            <button onClick={nextModel} style={{ ...arrowStyle, position: "absolute", right: "10px" }} aria-label="Next Model">&gt;</button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}