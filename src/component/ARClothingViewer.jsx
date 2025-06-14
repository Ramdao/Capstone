import React, { useState } from "react";
import './Modelcontainer.css';
import '../component/pages/PageGlobal.css';

// Add a new prop: isClientHomePage
const ARClothingViewer = ({ modelPath, isClientHomePage }) => {
  const [showAR, setShowAR] = useState(false);

  if (!modelPath) return null;

  // Replace .glb with .usdz for iOS AR
  const iosSrc = modelPath.replace(".glb", ".usdz");

  // Define conditional left style based on isClientHomePage prop
  const modelViewerLeftStyle = isClientHomePage ? "0%" : "-15%"; 

  return (
    <>
      <div className="ARmodel">
        {showAR && (
          <model-viewer
            src={modelPath}
            ios-src={iosSrc}
            ar
            ar-modes="scene-viewer quick-look webxr"
            auto-rotate
            camera-controls
            style={{
              top: "50px",
              left: modelViewerLeftStyle 
            }}
          >
            <button
              slot="ar-button"
              style={{
                backgroundColor: "#000",
                color: "#fff",
                padding: "10px",
                position: "absolute",
                left: "22%",
                top: "-10px",
              }}
            >
              👓 View in your space
            </button>
          </model-viewer>
        )}

        <button
          onClick={() => setShowAR(!showAR)}
          className="button-nav"
        >
          {showAR ? "Hide AR View" : "Show AR View"}
        </button>
      </div>
    </>
  );
};

export default ARClothingViewer;