
// AI prompt: How to get specific folders and view them
import { Canvas } from "@react-three/fiber";
import { motion } from 'framer-motion';
import { Bounds, OrbitControls } from "@react-three/drei";
import { useEffect, useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import ClothingModel from "../ClothingModel.jsx";
import ARClothingViewer from "../ARClothingViewer.jsx";
import { storage, ref, listAll, getDownloadURL } from "../../firebase.js";
import '../../component/pages/Client/Modelhome.css';

export default function CollectionPage() {
    const [availableFolders, setAvailableFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [modelFiles, setModelFiles] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [meshNames, setMeshNames] = useState([]);
    const [meshColors, setMeshColors] = useState({});
    const [isMobile, setIsMobile] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [folderError, setFolderError] = useState(null);

    
    const fetchFirebaseFolders = useCallback(async () => {
        setLoadingFolders(true);
        setFolderError(null);
        try {
            // Define the specific folders you want to display
            let folders = [
               
                { path: "", name: "Summer" },
                { path: "Classic/", name: "Classic" },
                { path: "Dramatic/", name: "Dramatic" },
                { path: "Gamine/", name: "Gamine" },
                { path: "Natural/", name: "Natural" },
                { path: "Romantic/", name: "Romantic" }
            ];

            setAvailableFolders(folders);

           
            const publicFolder = folders.find(f => f.path === "");
            if (publicFolder) {
                setSelectedFolder(publicFolder.path);
            } else if (folders.length > 0) {
                setSelectedFolder(folders[0].path);
            } else {
                setSelectedFolder(""); // No folders available
            }

        } catch (error) {
            console.error("Error setting up Firebase folders:", error);
            setFolderError("Failed to load folder options. Please try again.");
        } finally {
            setLoadingFolders(false);
        }
    }, []);

    // Call fetchFirebaseFolders on component mount
    useEffect(() => {
        fetchFirebaseFolders();
    }, [fetchFirebaseFolders]); 
    // Load model URLs from Firebase based on the selected folder
    useEffect(() => {
        const fetchModels = async () => {
           
            if (!selectedFolder && selectedFolder !== "") { // Allows for the root "" path
                console.warn("No folder selected to fetch models from.");
                setModelFiles([]);
                setSelectedModel(null);
                setMeshNames([]);
                setMeshColors({});
                return;
            }

            try {
                // Create a reference to the selected folder in Firebase Storage
                const folderRef = ref(storage, selectedFolder);
                // List all items (files and prefixes/subfolders) within that folder
                const folderList = await listAll(folderRef);

                // Filter for .glb or .gltf files and get their download URLs
                const allUrls = await Promise.all(
                    folderList.items
                        .filter(item => item.name.toLowerCase().endsWith('.glb') || item.name.toLowerCase().endsWith('.gltf'))
                        .map(item => getDownloadURL(item))
                );

                setModelFiles(allUrls);
                // Automatically select the first model if any are found
                if (allUrls.length > 0) {
                    setSelectedModel(allUrls[0]);
                } else {
                    setSelectedModel(null); // No models found
                }
             
                setMeshNames([]);
                setMeshColors({});
            } catch (error) {
                console.error(`Error fetching models from Firebase folder '${selectedFolder}':`, error);
                // Clear state on error
                setModelFiles([]);
                setSelectedModel(null);
                setMeshNames([]);
                setMeshColors({});
            }
        };

        fetchModels();

        // Handle mobile view for AR functionality
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        handleResize(); // Call initially to set the state
        return () => window.removeEventListener('resize', handleResize); // Cleanup listener
    }, [selectedFolder]); // Re-run whenever selectedFolder changes

    // Load mesh names and set initial colors when the selected model changes
    useEffect(() => {
        if (!selectedModel) {
            setMeshNames([]);
            setMeshColors({});
            return;
        }

        const loader = new GLTFLoader();
        loader.load(selectedModel, (gltf) => {
            const names = [];
            // Traverse the GLTF scene to find all meshes and extract their names
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    names.push(child.name);
                }
            });
            setMeshNames(names);

            // Initialize mesh colors, keeping existing colors if mesh name matches
            const initialColors = {};
            names.forEach((name) => {
                initialColors[name] = meshColors[name] || "#FFFFFF"; // Default to white
            });
            setMeshColors(initialColors);
        }, undefined, (error) => {
            console.error("Error loading GLTF model for mesh name extraction:", error);
        });
    }, [selectedModel]); 

    // Callback for when a mesh color is changed by the user
    const handleColorChange = (meshName, newColor) => {
        setMeshColors((prev) => ({ ...prev, [meshName]: newColor }));
    };

    // Functions to navigate between models
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

    // Inline style for navigation arrows
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
        <div className="pagelayout">
            <motion.h1
                className='about-heading'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                Collections
            </motion.h1>

            {/* Folder Selection Dropdown */}
            <div style={{ marginBottom: "20px" }}> {/* Added some margin for spacing */}

                <select
                    id="folder-select"
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    value={selectedFolder}
                    style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #777",
                        background: "#666",
                        color: "white",
                        fontSize: "1rem",
                        cursor: "pointer"
                    }}
                >
                    {loadingFolders ? (
                        <option value="">Loading collections...</option>
                    ) : folderError ? (
                        <option value="">Error loading collections</option>
                    ) : (
                        // Map through the availableFolders to create dropdown options
                        availableFolders.map((folder) => (
                            <option key={folder.path} value={folder.path}>
                                {folder.name}
                            </option>
                        ))
                    )}
                </select>
            </div>

            {/* Main Viewer Section */}
            <div className="model-container model-container-design" >
                {/* Previous Model Button */}
                {modelFiles.length > 1 && (
                    <button onClick={prevModel} style={{ ...arrowStyle, position: "absolute", left: "10px" }} aria-label="Previous Model">&lt;</button>
                )}

                <div className="model-viewer-canvas-wrapper" style={{ flexGrow: 1, height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {selectedModel ? (
                        <Canvas camera={{ position: [-30, 50, -20], fov: 70 }} style={{ flex: 1 }}>
                            <ambientLight intensity={0.8} />
                            <directionalLight position={[10, 10, 5]} />
                            <Bounds fit clip observe margin={1.5}>
                                <group rotation={[0, Math.PI, 0]}>
                                    <ClothingModel modelPath={selectedModel} meshColors={meshColors} />
                                </group>
                            </Bounds>
                            <OrbitControls makeDefault />
                        </Canvas>
                    ) : (
                        <p style={{ fontSize: "1.2rem", color: "#aaa" }}>
                            {modelFiles.length === 0 ? "No models in the selected collection. Try selecting another." : "Please select a model."}
                        </p>
                    )}
                </div>

                {/* Next Model Button */}
                {modelFiles.length > 1 && (
                    <button onClick={nextModel} style={{ ...arrowStyle, position: "absolute", right: "10px" }} aria-label="Next Model">&gt;</button>
                )}
            </div>

            {/* Color Pickers */}
            <div className="color-picker-design">
                <h3 style={{ marginBottom: "1rem", color: "#eee" }}>Customize Colors</h3>
                {meshNames.length > 0 ? (
                    meshNames.map((name) => (
                        <div key={name} style={{ marginBottom: "0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <label style={{ marginRight: "1rem", fontSize: "1rem", color: "#ddd" }}>{name}:</label>
                            <input
                                type="color"
                                value={meshColors[name] || "#FFFFFF"}
                                onChange={(e) => handleColorChange(name, e.target.value)}
                                style={{
                                    width: "60px",
                                    height: "35px",
                                    border: "2px solid #555",
                                    borderRadius: "5px",
                                    padding: "0",
                                    cursor: "pointer",
                                    backgroundColor: "transparent"
                                }}
                            />
                        </div>
                    ))
                ) : (
                    <p style={{ color: "#aaa" }}>Load a model to customize its colors. Or, no customizable meshes found.</p>
                )}
            </div>

            {/* Mobile AR Viewer */}
            <div className="ARModel-client">
                {isMobile && selectedModel && (
                    <ARClothingViewer modelPath={selectedModel} />
                )}
            </div>
        </div>
    );
}