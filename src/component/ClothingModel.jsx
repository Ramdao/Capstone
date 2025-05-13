import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

function ClothingModel({ modelPath, meshColors }) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && meshColors[child.name]) {
        child.material.color.set(meshColors[child.name]);
        child.material.needsUpdate = true;
      }
    });
  }, [scene, meshColors]);

  return <primitive object={scene} scale={1.5} />;
}

export default ClothingModel;
