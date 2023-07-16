import { Canvas } from '@react-three/fiber';
import DemoScene from 'components/DemoScene';
import React from 'react';

export default function App() {
  return (
    <Canvas>
      <DemoScene />
    </Canvas>
  );
}
