import React, { useState } from "react";

const ARClothingViewer = ({ modelPath }) => {
  const [showAR, setShowAR] = useState(false);

  if (!modelPath) return null;

  // Replace .glb with .usdz for iOS AR
  const iosSrc = modelPath.replace(".glb", ".usdz");

  return (
    <div style={{ padding: "2rem", position: "absolute", top: "190%", left: "1px", right: 0 }}>
      <h2>View Clothing in AR</h2>

      {showAR && (
        <model-viewer
          src={modelPath}
          ios-src={iosSrc}
          ar
          ar-modes="scene-viewer quick-look webxr"
          auto-rotate
          camera-controls
          style={{ width: "100%", maxWidth: "500px", height: "500px" }}
        >
          <button
            slot="ar-button"
            style={{
              backgroundColor: "#000",
              color: "#fff",
              padding: "10px",
              borderRadius: "5px",
              marginTop: "1rem",
            }}
          >
            👓 View in your space
          </button>
        </model-viewer>
      )}

      <button
        onClick={() => setShowAR(!showAR)}
        style={{ marginTop: "20px", padding: "10px 20px", borderRadius: "5px" }}
      >
        {showAR ? "Hide AR View" : "Show AR View"}
      </button>
    </div>
  );
};

export default ARClothingViewer;
