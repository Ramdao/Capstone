import { Canvas } from "@react-three/fiber";
import { motion } from 'framer-motion';
import { Bounds, OrbitControls } from "@react-three/drei";
import { useEffect, useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import ClothingModel from "../../ClothingModel.jsx";
import ARClothingViewer from "../../ARClothingViewer.jsx";
import { storage, ref, listAll, getDownloadURL } from "../../../firebase.js";
import './Modelhome.css';
import Select from 'react-select'; 
import { Box3, Vector3 } from 'three';

export default function ClientHomePage({ embedMode = true, auth }) {
  const [availableFolders, setAvailableFolders] = useState([
    { value: "", label: "Summer" }, 
    { value: "Classic", label: "Classic" },
    { value: "Dramatic", label: "Dramartic" },
    { value: "Gamine", label: "Gamine" },
    { value: "Natural", label: "Natural" },
    { value: "Romantic", label: "Romantic" },
  ]);

  const [selectedFolder, setSelectedFolder] = useState("Summer");
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
      const publicFolders = [
        { value: "", label: "Summer" }, 
        { value: "Classic", label: "Classic" },
        { value: "Dramatic", label: "Dramartic" },
        { value: "Gamine", label: "Gamine" },
        { value: "Natural", label: "Natural" },
        { value: "Romantic", label: "Romantic" },
      ];

      if (auth && auth.role === 'client' && auth.email) {
        const clientFolderPath = `clients/${auth.email}/`;
        const clientFolder = {
          value: clientFolderPath,
          label: `My Models (${auth.email})`
        };
        setAvailableFolders([...publicFolders, clientFolder]);
      } else {
        setAvailableFolders(publicFolders);
      }
    } catch (error) {
      console.error("Error fetching Firebase folders:", error);
      setFolderError("Failed to load folders. Please try again.");
    } finally {
      setLoadingFolders(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchFirebaseFolders();
  }, [fetchFirebaseFolders]);

  useEffect(() => {
    if (auth && auth.role === 'client' && auth.email && availableFolders.length > 0) {
      const clientFolderPath = `clients/${auth.email}/`;
      const foundFolder = availableFolders.find(folder => folder.value === clientFolderPath); // Check value
      if (foundFolder) {
        setSelectedFolder(clientFolderPath);
      } else {
        const publicFolder = availableFolders.find(f => f.value === "publicModels"); // Check value
        setSelectedFolder(publicFolder ? publicFolder.value : availableFolders[0].value); // Check value
      }
    } else {
      const publicFolder = availableFolders.find(f => f.value === "publicModels"); // Check value
      setSelectedFolder(publicFolder ? publicFolder.value : availableFolders[0].value); // Check value
    }
  }, [auth, availableFolders]);

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

  // Transform modelFiles into options format for react-select
  const modelOptions = modelFiles.map((model, index) => ({
    value: model,
    label: `Model ${index + 1}`
  }));

  // Find the currently selected folder option for react-select
  const currentSelectedFolderOption = availableFolders.find(
    (folder) => folder.value === selectedFolder
  );

  // Find the currently selected model option for react-select
  const currentSelectedModelOption = modelOptions.find(
    (model) => model.value === selectedModel
  );

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
        
       <Select
              id="folder-select"
              options={availableFolders}
              value={currentSelectedFolderOption}
              onChange={(option) => setSelectedFolder(option ? option.value : "")}
              isLoading={loadingFolders}
              isDisabled={folderError}
              placeholder={folderError ? "Error loading folders" : "Select a folder..."}
              classNamePrefix="my-select" 
  
        />

        {/* Model Selection Dropdown (visible when not in embed mode) */}
        {!embedMode && (
          <>
            <label htmlFor="model-select" style={{ marginRight: "1rem", fontSize: "1.1rem", marginLeft: "2rem" }}>Select Model:</label>
            <Select
              id="model-select"
              options={modelOptions}
              value={currentSelectedModelOption} // Use the option object
              onChange={(option) => setSelectedModel(option ? option.value : null)} // Get value from option
              isDisabled={modelFiles.length === 0}
              placeholder={modelFiles.length === 0 ? "No models in this folder" : "Select a model..."}
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "8px",
                  border: "1px solid #666",
                  background: "#555",
                  color: "black",
                  fontSize: "1rem",
                  cursor: "pointer",
                  width: "200px", 
                  minHeight: 'auto',
                }),
                singleValue: (baseStyles) => ({
                  ...baseStyles,
                  color: 'black',
                }),
                input: (baseStyles) => ({
                  ...baseStyles,
                  color: 'black',
                }),
                menu: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: '#555',
                  zIndex: 9999,
                }),
                option: (baseStyles, { isFocused, isSelected }) => ({
                  ...baseStyles,
                  backgroundColor: isSelected ? '#333' : isFocused ? '#444' : '#555',
                  color: 'black',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: '#222',
                  },
                }),
                placeholder: (baseStyles) => ({
                  ...baseStyles,
                  color: '#222',
                }),
              }}
            />
          </>
        )}
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

      {/* Color Pickers */}
      {embedMode && (
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
      )}

      {/* Mobile AR Viewer */}
      <div className="ARModel-client">
        {isMobile && selectedModel && (
          <ARClothingViewer modelPath={selectedModel} isClientHomePage={true} />
        )}
      </div>
    </div>
  );
}