import { OrbitControls, Stage } from "@react-three/drei";
import { Perf } from "r3f-perf";
import React, { useEffect, useRef, useState } from "react";
import Grid from "./Grid";
import PointCloud from "./PointCloud";
import { parsePCDFile } from "../util/pcdUtil";
import { button, useControls } from "leva";
import * as THREE from "three";
import { icp } from "icpts";

/**
 * Primary Scene
 */

const identity = new THREE.Matrix4();

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const DemoScene = () => {
    const [points, setPoints] = useState([] as number[][]);
    const [matrixSource, setMatrixSource] = useState<THREE.Matrix4>(identity);
    const [matrixReference, setMatrixReference] = useState<THREE.Matrix4>(identity);

    const sourcePoints = useRef<Float32Array>();
    const referencePoints = useRef<Float32Array>();

    const toggle = useRef(true);
    useControls("ICP", {
        ["Point to Point"]: button(async () => {
            console.log(sourcePoints);
            console.log(referencePoints);
            // Needs to get world points for both
            const mat = await icp.pointToPlane(sourcePoints.current!, referencePoints.current!, {
                maxIterations: 100,
                tolerance: 1e-20,
                initialPose: IDENTITY
            });
            console.log(mat);
            // setMatrixSource(
            //     toggle.current
            //         ? new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 4, 0, 0))
            //         : new THREE.Matrix4()
            //               .makeRotationFromEuler(new THREE.Euler(Math.PI / 4, 0, 0))
            //               .invert()
            // );
            // Already column major
            // console.log(mat)
            setMatrixSource(new THREE.Matrix4().fromArray(mat));
            toggle.current = !toggle.current;
        })
    });

    const onTransformEnd = (type: "source" | "reference") => (worldPose: Float32Array) => {
        if (type === "source") {
            sourcePoints.current = worldPose;
        } else {
            referencePoints.current = worldPose;
        }
    };

    const getPoints = async () => {
        const points = await parsePCDFile("./bun4.pcd");
        setPoints(points);
    };

    useEffect(() => {
        const sourceMat = new THREE.Matrix4();
        const referenceMat = new THREE.Matrix4();
        setMatrixSource(sourceMat);
        setMatrixReference(referenceMat);

        getPoints();
    }, []);

    return (
        <>
            <Perf position="top-left" />
            <OrbitControls makeDefault />

            <Stage
                shadows={{ type: "contact", opacity: 0.2, blur: 3 }}
                environment="sunset"
                preset="portrait"
                intensity={2}
            >
                <PointCloud
                    points={points}
                    color="red"
                    pointSize={0.1}
                    matrix={matrixSource}
                    onTransformEnd={onTransformEnd("source")}
                />
                <PointCloud
                    points={points}
                    color="green"
                    pointSize={0.1}
                    matrix={matrixReference}
                    onTransformEnd={onTransformEnd("reference")}
                />
                <Grid size={20} divisions={20} />
            </Stage>
        </>
    );
};

export default DemoScene;
