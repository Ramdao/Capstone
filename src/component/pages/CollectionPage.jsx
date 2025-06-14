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
  const [selectedFolder, setSelectedFolder] = useState("publicModels"); // Default to public models
  const [modelFiles, setModelFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [meshNames, setMeshNames] = useState([]);
  const [meshColors, setMeshColors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [folderError, setFolderError] = useState(null);

  // Fetch all folders and then filter out client-specific ones
  const fetchFirebaseFolders = useCallback(async () => {
    setLoadingFolders(true);
    setFolderError(null);
    try {
      const rootRef = ref(storage, '/'); // List all items from the root of your storage
      const result = await listAll(rootRef);

      const folders = [{ path: "", name: "Root Folder" }]; 

    
      setAvailableFolders(folders);

      // Set initial selected folder to 'publicModels' if it exists, otherwise the first available
      const publicFolder = folders.find(f => f.path === "publicModels");
      if (publicFolder) {
        setSelectedFolder(publicFolder.path);
      } else if (folders.length > 0) {
        setSelectedFolder(folders[0].path);
      } else {
        setSelectedFolder(""); // No folders available
      }

    } catch (error) {
      console.error("Error fetching Firebase folders:", error);
      setFolderError("Failed to load folders. Please try again.");
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
      if (!selectedFolder && selectedFolder !== "") {
        console.warn("No folder selected to fetch models from.");
        setModelFiles([]);
        setSelectedModel(null);
        setMeshNames([]);
        setMeshColors({});
        return;
      }

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
          setSelectedModel(allUrls[0]);
        } else {
          setSelectedModel(null);
        }
        setMeshNames([]);
        setMeshColors({});
      } catch (error) {
        console.error(`Error fetching models from Firebase folder '${selectedFolder}':`, error);
        setModelFiles([]);
        setSelectedModel(null);
        setMeshNames([]);
        setMeshColors({});
      }
    };

    fetchModels();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedFolder]);

  // Load mesh names + set initial colors when model changes
  useEffect(() => {
    if (!selectedModel) {
      setMeshNames([]);
      setMeshColors({});
      return;
    }

    const loader = new GLTFLoader();
    loader.load(selectedModel, (gltf) => {
      const names = [];
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          names.push(child.name);
        }
      });
      setMeshNames(names);

      const initialColors = {};
      names.forEach((name) => {
        initialColors[name] = meshColors[name] || "#FFFFFF";
      });
      setMeshColors(initialColors);
    }, undefined, (error) => {
      console.error("Error loading GLTF model for mesh name extraction:", error);
    });
  }, [selectedModel]);

  const handleColorChange = (meshName, newColor) => {
    setMeshColors((prev) => ({ ...prev, [meshName]: newColor }));
  };

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
      <div>
        <label htmlFor="folder-select" style={{ fontSize: "1.1rem" }}></label>
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

        
        
      </div>

      {/* Main Viewer Section */}
      <div className="model-container model-container-design" >
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
              {modelFiles.length === 0 ? "Loading models or no models in selected folder." : "Please select a model."}
            </p>
          )}
        </div>

        {modelFiles.length > 1 && (
          <button onClick={nextModel} style={{ ...arrowStyle, position: "absolute", right: "10px" }} aria-label="Next Model">&gt;</button>
        )}
      </div>

      {/* Color Pickers (always visible in CollectionPage) */}
      <div className="color-picker-design">
        <h3 style={{ marginBottom: "1rem", color: "#eee" }}>Customize Colors</h3>
        {meshNames.length > 0 ? (
          meshNames.map((name) => (
            <div key={name} style={{ marginBottom: "0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ marginRight: "1rem", fontSize: "1rem" }}>{name}:</label>
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