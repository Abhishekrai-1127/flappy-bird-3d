"use client";
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

function FloatingSpheres() {
  const group = useRef();

  useFrame(() => {
    // slow rotation
    group.current.rotation.y += 0.002;
    group.current.rotation.x += 0.001;
  });

  return (
    <group ref={group}>
      {[...Array(60)].map((_, i) => {
        const x = Math.random() * 50 - 25;
        const y = Math.random() * 30 - 15;
        const z = Math.random() * -50;
        const scale = Math.random() * 2 + 0.5;
        const color = `hsl(${Math.random() * 360}, 80%, 60%)`;

        return (
          <mesh key={i} position={[x, y, z]} scale={scale}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function AnimatedBackground() {
  return (
    <Canvas
      className="absolute top-0 left-0 w-full h-full -z-10"
      camera={{ position: [0, 0, 15], fov: 75 }}
      style={{ background: "linear-gradient(to top, #70c5ce, #b0e4f1)" }} // 🌤 Flappy Bird sky
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <FloatingSpheres />
      <Stars radius={50} depth={50} count={500} factor={4} fade />
    </Canvas>
  );
}
