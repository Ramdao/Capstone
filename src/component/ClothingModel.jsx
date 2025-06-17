
import React, { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three'; 

// AI: Prompt how to generate range of hex colors
function mulberry32(seed) {
  let s0 = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) >>> 0;
  return function() {
    let t = (s0 += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper function to generate a more aggressively varied color based on a base hex and a unique mesh identifier (meshName).
const getVariedColor = (baseColorHex, meshName) => {
  const baseColor = new THREE.Color(baseColorHex);
  const hsl = {};
  baseColor.getHSL(hsl);

  const random = mulberry32(`${baseColorHex}-${meshName}`);

  const lightnessVariation = (random() * 0.6) - 0.3;
  const saturationVariation = (random() * 0.6) - 0.3;
  const hueVariation = (random() * 0.04) - 0.02;

  hsl.h = (hsl.h + hueVariation + 1) % 1;
  hsl.s = Math.max(0.05, Math.min(0.95, hsl.s + saturationVariation));
  hsl.l = Math.max(0.05, Math.min(0.95, hsl.l + lightnessVariation));

  const variedColor = new THREE.Color();
  variedColor.setHSL(hsl.h, hsl.s, hsl.l);

  return variedColor;
};

// Function component for rendering and coloring the 3D clothing model
function ClothingModel({ modelPath, meshColors, uniformColor }) {
  const { scene } = useGLTF(modelPath);

  
  const clonedScene = useMemo(() => {
    if (!scene) return null;

    const cloned = scene.clone();
    cloned.traverse((obj) => {
      if (obj.isMesh) {
        // Ensure that materials are cloned to allow independent modification
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map(mat => mat.clone());
        } else if (obj.material) {
          obj.material = obj.material.clone();
        }
      }
    });
    return cloned;
  }, [scene, modelPath]); // Re-clone only if the original scene or modelPath changes

  // useEffect hook to apply colors to the models meshes whenever meshColors or uniformColor changes.
  useEffect(() => {
    if (!clonedScene) {
      // console.log('ClothingModel useEffect: clonedScene not yet available.');
      return;
    }

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        
        if (!child.material) {
          // console.warn(`ClothingModel: Mesh ${child.name} has no material to modify. Skipping.`);
          return;
        }

        // Handle cases where material might be an array (MultiMaterial)
        const materialsToUpdate = Array.isArray(child.material) ? child.material : [child.material];

        materialsToUpdate.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
            let targetColor;

            // Prioritize uniformColor if provided
            if (uniformColor) {
              targetColor = getVariedColor(uniformColor, child.name);
            }
            // Otherwise, use individual meshColors
            else if (meshColors && meshColors[child.name]) {
              targetColor = new THREE.Color(meshColors[child.name]);
            } else {
              // If no specific color is set, default to a base color (e.g., white)
              targetColor = new THREE.Color("#FFFFFF");
            }

            // Apply the color and ensure material needs update
            material.color.copy(targetColor);
            material.needsUpdate = true;
          } else {
            // console.warn(`ClothingModel: Mesh ${child.name} material is not a MeshStandardMaterial or MeshBasicMaterial. Type: ${material.type}. Skipping color modification.`);
          }
        });
      }
    });
  }, [clonedScene, meshColors, uniformColor]); 

  if (!clonedScene) {
    return null;
  }

  return <primitive object={clonedScene} scale={1.5} />;
}

export default ClothingModel;