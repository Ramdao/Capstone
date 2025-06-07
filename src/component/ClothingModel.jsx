// src/ClothingModel.jsx
import React, { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three'; // Import Three.js for creating materials

// Helper function for consistent pseudo-random numbers based on a string seed.
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
  const hsl = {}; // Object to store Hue, Saturation, Lightness components

  // Convert the base color from RGB to HSL.
  baseColor.getHSL(hsl);

  // Create a consistent pseudo-random number generator for this specific mesh and base color.
  const random = mulberry32(`${baseColorHex}-${meshName}`);

  // Lightness (L) variation: Increased range for more pronounced shading.
  // Now from -0.3 to +0.3 (previous was -0.2 to +0.2)
  const lightnessVariation = (random() * 0.6) - 0.3;

  // Saturation (S) variation: Increased range for more vibrant or desaturated parts.
  // Now from -0.3 to +0.3 (previous was -0.2 to +0.2)
  const saturationVariation = (random() * 0.6) - 0.3;

  // Hue (H) variation: Slightly increased range for subtle tint shifts.
  // Now from -0.02 to +0.02 (previous was -0.01 to +0.01)
  const hueVariation = (random() * 0.04) - 0.02;

  // Apply variations, ensuring values stay within valid 0-1 range (and hue wraps correctly)
  hsl.h = (hsl.h + hueVariation + 1) % 1; // Hue wraps around 0-1
  hsl.s = Math.max(0.05, Math.min(0.95, hsl.s + saturationVariation)); // Clamp saturation
  hsl.l = Math.max(0.05, Math.min(0.95, hsl.l + lightnessVariation)); // Clamp lightness

  // Create a new Three.js Color object and set its HSL components
  const variedColor = new THREE.Color();
  variedColor.setHSL(hsl.h, hsl.s, hsl.l);

  return variedColor; // Return the new, varied Three.js Color object
};

// // Helper function to generate more dramatic color variations while maintaining harmony
// const getVariedColor = (baseColorHex, meshName) => {
//   const baseColor = new THREE.Color(baseColorHex);
//   const hsl = {};
//   baseColor.getHSL(hsl);

//   // Create a consistent but more varied random number generator
//   const random = mulberry32(`${baseColorHex}-${meshName}`);
  
//   // More aggressive variation parameters
//   const hueRange = 0.05; // Increased from 0.02 - allows for more noticeable hue shifts
//   const saturationRange = 0.5; // Increased from 0.3 - allows for both very muted and very saturated
//   const lightnessRange = 0.4; // Increased from 0.3 - allows for both very dark and very light
  
//   // Apply variations with more dramatic ranges
//   hsl.h = (hsl.h + (random() * hueRange * 2 - hueRange + 1)) % 1;
//   hsl.s = Math.max(0.1, Math.min(0.9, hsl.s + (random() * saturationRange * 2 - saturationRange)));
//   hsl.l = Math.max(0.1, Math.min(0.9, hsl.l + (random() * lightnessRange * 2 - lightnessRange)));

//   // Add an additional "personality" factor based on mesh name
//   const personalityFactor = meshName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
//   // Apply personality factor to make certain meshes stand out more
//   if (personalityFactor % 3 === 0) {
//     hsl.h = (hsl.h + 0.03) % 1; // Slight extra hue shift
//   } else if (personalityFactor % 5 === 0) {
//     hsl.s = Math.min(0.95, hsl.s * 1.3); // Boost saturation
//   } else if (personalityFactor % 7 === 0) {
//     hsl.l = Math.min(0.95, hsl.l * 1.4); // Boost lightness
//   }

//   const variedColor = new THREE.Color();
//   variedColor.setHSL(hsl.h, hsl.s, hsl.l);
  
//   return variedColor;
// };

// Function component for rendering and coloring the 3D clothing model
function ClothingModel({ modelPath, meshColors, uniformColor }) {
  // useGLTF hook loads the GLTF/GLB model from the specified path
  const { scene } = useGLTF(modelPath);

  // useEffect hook to apply colors to the model's meshes.
  useEffect(() => {
    if (!scene) {
      console.log('ClothingModel useEffect: Scene not yet available.');
      return;
    }

    // Traverse the scene to access individual mesh objects.
    scene.traverse((child) => {
      if (child.isMesh) {
        if (!child.material) {
          console.warn(`ClothingModel: Mesh ${child.name} has no material to modify. Skipping.`);
          return;
        }

        // --- Logic for applying AI-generated varied color (priority) ---
        if (uniformColor) {
          // Get a unique varied color for the current mesh using its name
          const variedColor = getVariedColor(uniformColor, child.name);

          // Ensure the material is a MeshStandardMaterial (or similar) or replace it.
          if (!(child.material instanceof THREE.MeshStandardMaterial)) {
              child.material = new THREE.MeshStandardMaterial({ color: variedColor });
          } else {
              child.material.color.copy(variedColor);
          }
          child.material.needsUpdate = true;
          // console.log(`ClothingModel: Applied AI-varied color to mesh: ${child.name}, Color: ${variedColor.getHexString()}`);
        }
        // --- Fallback logic for applying individual meshColors ---
        else if (meshColors && meshColors[child.name]) {
          if (child.material.color) {
              child.material.color.set(meshColors[child.name]);
              child.material.needsUpdate = true;
              // console.log('ClothingModel: Applied individual color to mesh:', child.name, 'Color:', meshColors[child.name]);
          } else {
               console.warn(`ClothingModel: Mesh ${child.name} material does not have a color property to set. Skipping individual color.`);
          }
        }
      }
    });

  }, [scene, meshColors, uniformColor]);

  
  
  const clonedScene = useMemo(() => {
    if (scene) {
        const cloned = scene.clone();
        cloned.traverse((obj) => {
            if (obj.isMesh) {
                if (Array.isArray(obj.material)) {
                    obj.material = obj.material.map(mat => mat.clone());
                } else if (obj.material) {
                    obj.material = obj.material.clone();
                }
            }
        });
        return cloned;
    }
    return null;
  }, [scene]);

  if (!clonedScene) {
      return null;
  }

  return <primitive object={clonedScene} scale={1.5} />;
}

export default ClothingModel;