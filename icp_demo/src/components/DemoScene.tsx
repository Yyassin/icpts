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

const DemoScene = () => {
    const [points, setPoints] = useState([] as number[][]);
    const [matrixSource, setMatrixSource] = useState<THREE.Matrix4>(identity);
    const [matrixReference, setMatrixReference] = useState<THREE.Matrix4>(identity);

    const sourcePoints = useRef<Float32Array>();
    const referencePoints = useRef<Float32Array>();

    const toggle = useRef(true);
    useControls("ICP", {
        ["Point to Point"]: button(async () => {
            const mat = await icp.pointToPointICP(sourcePoints.current!, referencePoints.current!);
            console.log(mat);
            // setMatrixSource(
            //     toggle.current
            //         ? new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 4, 0, 0))
            //         : new THREE.Matrix4()
            //               .makeRotationFromEuler(new THREE.Euler(Math.PI / 4, 0, 0))
            //               .invert()
            // );
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
        const points = await parsePCDFile("./bunny.pcd");
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
