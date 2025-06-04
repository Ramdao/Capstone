// src/pages/ClientAskAIPage.js (adjust path as needed)

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../PageGlobal.css'; 


const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function ClientAskAIPage() {
    const [generatedColor, setGeneratedColor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [colorPrompt, setColorPrompt] = useState(''); // State for user's color request

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

    return (
        <div className="pagelayout">
            <motion.h1
                className="about-heading"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                Ask AI to Generate a Color
            </motion.h1>

            <motion.div
                className="box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
               
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p>Enter a description for the color you'd like:</p>
                    <input
                        type="text"
                        value={colorPrompt}
                        onChange={(e) => setColorPrompt(e.target.value)}
                        placeholder="e.g., 'a calm blue', 'a fiery red', 'a futuristic neon green'"
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            width: '80%',
                            marginBottom: '15px',
                            fontSize: '1em'
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
                </div>
            </motion.div>
        </div>
    );
}