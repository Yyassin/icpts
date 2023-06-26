import React from "react";
import { Canvas } from "@react-three/fiber";
import DemoScene from "./components/DemoScene";
import "./App.css";

const App = () => {
    return (
        <Canvas>
            <DemoScene />
        </Canvas>
    );
};

export default App;
