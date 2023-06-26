import { PivotControls } from "@react-three/drei";
import { matrixHelpers } from "icpts";
import { FlatArray } from "icpts/src/types";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const getWorldPositions = (positions: FlatArray<number>, worldMat: THREE.Matrix4) => {
    /**
     * ThreeJS uses column-major ordering but we'll use row-major so transpose
     * Source: https://threejs.org/docs/index.html?q=matrix#api/en/math/Matrix4
     */
    const matrixWorld = matrixHelpers.fromArray(worldMat.elements, 4).transpose();

    // Local object points
    const localPoints = matrixHelpers.flatToVec3Mat(positions);

    // Multiply the local points by the matrixWorld to obtain the transformed points
    const transformedPoints = matrixWorld.matMul(localPoints);

    // Extract the transformed points as a regular JavaScript array
    const worldPositions = matrixHelpers.matToFlat(transformedPoints);
    matrixHelpers.flush();

    return worldPositions;
};

const getPointPositions = (points: THREE.Points) => {
    const localPositionsAttr = points.geometry.attributes["position"] as THREE.BufferAttribute;
    return localPositionsAttr.array as FlatArray<number>;
};
const getPointsInWorld = (points: THREE.Points) => {
    const worldMat = points.matrixWorld;
    const localPositions = getPointPositions(points);
    //TODO: Don't create many arrays
    return new Float32Array(getWorldPositions(localPositions, worldMat));
};

const PointCloud = ({
    points,
    color,
    pointSize,
    matrix,
    onTransformEnd
}: {
    points: number[][];
    color: THREE.ColorRepresentation;
    pointSize: number;
    matrix: THREE.Matrix4;
    onTransformEnd: (worldPose: Float32Array) => void;
}) => {
    const pointCloud3JS = useRef<THREE.Points>(null);

    const material = useMemo(
        () => new THREE.PointsMaterial({ color, size: pointSize }),
        [color, pointSize]
    );

    //  Create a buffer geometry with the points
    const geometry = useMemo(() => {
        const positions = new Float32Array(points.flat());
        // 3 elements per position
        const bufferAttribute = new THREE.BufferAttribute(positions, 3);
        return new THREE.BufferGeometry().setAttribute("position", bufferAttribute);
    }, [points]);

    useEffect(() => {
        if (pointCloud3JS.current) {
            pointCloud3JS.current.applyMatrix4(matrix);
            const localPositions = getPointPositions(pointCloud3JS.current);
            onTransformEnd(localPositions as Float32Array);
        }
    }, [pointCloud3JS, matrix, geometry]);

    return (
        <PivotControls
            // TODO: Expose the offset vector
            offset={[0, 1, 0]}
            depthTest={false}
            lineWidth={4}
            axisColors={["#9381ff", "#ff4d6d", "#7ae582"]}
            scale={100}
            fixed={true}
            onDragEnd={() => {
                const worldPoints = getPointsInWorld(pointCloud3JS.current!);
                onTransformEnd(worldPoints);
            }}
        >
            <points ref={pointCloud3JS} geometry={geometry} material={material} />
        </PivotControls>
    );
};

export default PointCloud;
