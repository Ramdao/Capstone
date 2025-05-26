import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import ClothingModel from "./ClothingModel.jsx";
import ARClothingViewer from "./ARClothingViewer";
import { storage, ref, listAll, getDownloadURL } from "../firebase.js";

export default function ClothViewer({ embedMode = false }) {
  const [modelFiles, setModelFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [meshNames, setMeshNames] = useState([]);
  const [meshColors, setMeshColors] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Load model URLs from Firebase
  useEffect(() => {
    const fetchModels = async () => {
      const rootRef = ref(storage, ""); // root
      const folderRef = ref(storage, "clients/defaultUser"); 

      const [rootList, folderList] = await Promise.all([
        listAll(rootRef),
        listAll(folderRef),
      ]);

      const rootUrls = await Promise.all(rootList.items.map(item => getDownloadURL(item)));
      const folderUrls = await Promise.all(folderList.items.map(item => getDownloadURL(item)));

      const allUrls = [...rootUrls, ...folderUrls];

      setModelFiles(allUrls);
      setSelectedModel(allUrls[0]); // Set first model as default
    };

    fetchModels();
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // Load mesh names + set initial colors when model changes
  useEffect(() => {
    if (!selectedModel) return;

    const loader = new GLTFLoader();
    loader.load(selectedModel, (gltf) => {
      const names = [];
      gltf.scene.traverse((child) => {
        if (child.isMesh) names.push(child.name);
      });
      setMeshNames(names);

      const initialColors = {};
      names.forEach((name) => {
        initialColors[name] = meshColors[name] || "#ff69b4";
      });
      setMeshColors(initialColors);
    });
  }, [selectedModel]);

  const handleColorChange = (meshName, newColor) => {
    setMeshColors((prev) => ({ ...prev, [meshName]: newColor }));
  };

  // Arrow button handlers for next/prev model
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
    <div style={{ display: "flex", flexDirection: "column", height: embedMode ? "auto" : "130vh" }}>
      {/* Model selection buttons for non-embed mode */}
      {!embedMode && (
        <div style={{ display: "flex", overflowX: "auto", padding: "2rem", background: "#333" }}>
          {modelFiles.map((model, index) => (
            <button
              key={index}
              onClick={() => setSelectedModel(model)}
              style={{
                marginRight: "1rem",
                padding: "1.5rem",
                background: selectedModel === model ? "#555" : "#888",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "5px"
              }}
            >
              Model {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Model viewer with arrows for embed mode */}
      {embedMode ? (
        <div style={{ display: "block", alignItems: "cneter", justifyContent: "center", height: "30vh", position:'absolute', width: "10vw", left: "70%", top: "50%", transform: "translate(-50%, -50%)", display: "flex" }}>
          <button onClick={prevModel} style={arrowStyle} aria-label="Previous Model">&lt;</button>
          <div style={{ flex: 1, height: "100%" }}>
            <Canvas camera={{ position: [-30, 50, -20], fov: 70 }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[10, 10, 5]} />
              <Bounds fit clip observe margin={1.5}>
                <group rotation={[0, Math.PI, 0]}>
                  {selectedModel && <ClothingModel modelPath={selectedModel} meshColors={meshColors} />}
                </group>
              </Bounds>
              <OrbitControls makeDefault />
            </Canvas>
          </div>
          <button onClick={nextModel} style={arrowStyle} aria-label="Next Model">&gt;</button>
        </div>
      ) : (
        // Full viewer for non-embed mode
        <div style={{ flex: 1 }}>
          <Canvas camera={{ position: [-30, 50, -20], fov: 70 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} />
            <Bounds fit clip observe margin={1.5}>
              <group rotation={[0, Math.PI, 0]}>
                {selectedModel && <ClothingModel modelPath={selectedModel} meshColors={meshColors} />}
              </group>
            </Bounds>
            <OrbitControls makeDefault />
          </Canvas>
        </div>
      )}

      {/* Color Pickers */}
      {/* <div style={{ padding: "1rem", background: "#222", color: "white" }}>
        <h3>Customize Colors</h3>
        {meshNames.map((name) => (
          <div key={name} style={{ marginBottom: "0.5rem" }}>
            <label style={{ marginRight: "1rem" }}>{name}:</label>
            <input
              type="color"
              value={meshColors[name] || "#ff69b4"}
              onChange={(e) => handleColorChange(name, e.target.value)}
            />
          </div>
        ))}
      </div> */}

      {/* Mobile AR Viewer */}
      {isMobile && selectedModel && <ARClothingViewer modelPath={selectedModel} />}
    </div>
  );
}
