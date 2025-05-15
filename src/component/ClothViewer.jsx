import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import ClothingModel from "./ClothingModel.jsx";
import ARClothingViewer from "./ARClothingViewer";
import { storage, ref, listAll, getDownloadURL } from "../firebase.js";

export default function ClothViewer() {
  const [modelFiles, setModelFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [meshNames, setMeshNames] = useState([]);
  const [meshColors, setMeshColors] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Load model URLs from Firebase
  useEffect(() => {
    const fetchModels = async () => {
      const modelRef = ref(storage, ""); // root folder of your bucket
      const res = await listAll(modelRef);
      const urls = await Promise.all(res.items.map(item => getDownloadURL(item)));

      setModelFiles(urls);
      setSelectedModel(urls[0]); // Set first model as default
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "130vh" }}>
      {/* Model Selection */}
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

      {/* 3D Canvas */}
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

      {/* Color Pickers */}
      <div style={{ padding: "1rem", background: "#222", color: "white" }}>
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
      </div>

      {/* Mobile AR Viewer */}
      {isMobile && selectedModel && <ARClothingViewer modelPath={selectedModel} />}
    </div>
  );
}
