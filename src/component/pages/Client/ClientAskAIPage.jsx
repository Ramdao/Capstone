import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { useEffect, useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import ClothingModel from "../../ClothingModel.jsx";
import ARClothingViewer from "../../ARClothingViewer.jsx";
import { storage, ref, listAll, getDownloadURL } from "../../../firebase.js";
import '../../Modelcontainer.css';

export default function ClientHomePage({ embedMode = true, auth }) {
  // Initialize availableFolders with static entries, dynamic ones will be added
  const [availableFolders, setAvailableFolders] = useState([
    { path: "", name: "Root Folder" },
    { path: "publicModels", name: "Public Models" }, // Example: if you have a general public folder
  ]);

  const [selectedFolder, setSelectedFolder] = useState(availableFolders[0].path);

  const [modelFiles, setModelFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [meshNames, setMeshNames] = useState([]);
  const [meshColors, setMeshColors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [folderError, setFolderError] = useState(null);

  // --- MODIFIED: Function to fetch folders from Firebase Storage ---
  const fetchFirebaseFolders = useCallback(async () => {
    setLoadingFolders(true);
    setFolderError(null);
    try {
      let foldersToDisplay = [
        { path: "", name: "Root Folder" },
        { path: "publicModels", name: "Public Models" },
      ];

      // If authenticated as a client, only add their specific folder
      if (auth && auth.role === 'client' && auth.email) {
        const clientEmail = auth.email;
        const clientFolderPath = `clients/${clientEmail}/`;
        const folderRef = ref(storage, clientFolderPath);

        // Verify if the client's folder exists (optional, but good for robustness)
        // You might attempt to list its contents to see if it's a valid path
        // For simplicity, we'll just add it if the user is a client.
        // A more robust check might involve trying to list its contents.
        
        foldersToDisplay.push({
          path: clientFolderPath,
          name: `My Folder: ${clientEmail.replace(/\./g, ' DOT ')}`
        });
        
        // If the user is a client, automatically select their folder
        setSelectedFolder(clientFolderPath);

      } else {
        // For stylists, admins, or unauthenticated users, list all client folders
        const clientsRootRef = ref(storage, 'clients/');
        const res = await listAll(clientsRootRef);

        const dynamicClientFolders = res.prefixes.map(folderRef => {
          return {
            path: folderRef.fullPath,
            name: `Client: ${folderRef.name.replace(/\./g, ' DOT ')}`
          };
        });

        // Combine static and dynamic client folders
        foldersToDisplay = [...foldersToDisplay, ...dynamicClientFolders];
      }

      // Filter out any duplicates and set the final available folders
      const uniqueFolders = [];
      const seenPaths = new Set();
      foldersToDisplay.forEach(folder => {
        if (!seenPaths.has(folder.path)) {
          uniqueFolders.push(folder);
          seenPaths.add(folder.path);
        }
      });
      setAvailableFolders(uniqueFolders);

    } catch (error) {
      console.error("Error fetching Firebase folders:", error);
      setFolderError("Failed to load folders. Please try again.");
    } finally {
      setLoadingFolders(false);
    }
  }, [auth]); // Dependency array includes 'auth' now

  useEffect(() => {
    fetchFirebaseFolders();
  }, [fetchFirebaseFolders]);

  // Removed the second useEffect for auto-selecting folder
  // as the logic is now integrated into fetchFirebaseFolders

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

        console.log(`Contents of folder '${selectedFolder}':`, folderList.items.map(item => item.fullPath));
        console.log(`Subfolders (prefixes) in '${selectedFolder}':`, folderList.prefixes.map(prefix => prefix.fullPath));

        const allUrls = await Promise.all(
          folderList.items
            .filter(item => item.name.toLowerCase().endsWith('.glb') || item.name.toLowerCase().endsWith('.gltf'))
            .map(item => getDownloadURL(item))
        );

        console.log(`Fetched raw URLs from '${selectedFolder}':`, allUrls);

        const filteredUrls = allUrls;

        setModelFiles(filteredUrls);
        if (filteredUrls.length > 0) {
          setSelectedModel(filteredUrls[0]);
          console.log(`Displayable models from '${selectedFolder}':`, filteredUrls);
        } else {
          setSelectedModel(null);
          console.warn(`No models found in folder: '${selectedFolder}'. Check Firebase Storage paths and file types.`);
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

    console.log("Attempting to load selected model for meshes:", selectedModel);
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
      console.log("Model loaded, mesh names:", names);
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: embedMode ? "auto" : "100vh", backgroundColor: "#1a1a1a", color: "white" }}>
      {/* Folder Selection Dropdown */}
      <div style={{ padding: "1rem", background: "#444", borderBottom: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
        <label htmlFor="folder-select" style={{ fontSize: "1.1rem" }}>Select Folder:</label>
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

        {/* Model Selection Dropdown (visible when not in embed mode) */}
        {!embedMode && (
          <>
            <label htmlFor="model-select" style={{ marginRight: "1rem", fontSize: "1.1rem" }}>Select Model:</label>
            <select
              id="model-select"
              onChange={(e) => setSelectedModel(e.target.value)}
              value={selectedModel || ''}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "1px solid #666",
                background: "#555",
                color: "white",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              {modelFiles.length === 0 ? (
                <option value="">No models in this folder</option>
              ) : (
                modelFiles.map((model, index) => (
                  <option key={index} value={model}>
                    Model {index + 1}
                  </option>
                ))
              )}
            </select>
          </>
        )}
      </div>

      {/* Main Viewer Section */}
      <div className="model-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: embedMode ? "400px" : "500px", position: "relative" }}>
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
        <div style={{ padding: "1.5rem", background: "#222", borderTop: "1px solid #444", maxHeight: "30vh", overflowY: "auto" }}>
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
      {isMobile && selectedModel && (
        <ARClothingViewer modelPath={selectedModel} />
      )}
    </div>
  );
}