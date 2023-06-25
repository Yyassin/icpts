import * as THREE from "three";

/**
 * ICP utilities
 */

export type ICPOptions = {
    initialPose: number[];
    maxIterations: number;
    tolerance: number;
};
const IDENTITY = new THREE.Matrix4().transpose().elements;

const fillMat = (matrix: THREE.Matrix4) => {
    //Translation
    const translation = new THREE.Vector3(1, 2, 3); // Set the translation values
    matrix.makeTranslation(translation.x, translation.y, translation.z);

    //Rotation
    const rotation = new THREE.Quaternion(); // Create a new quaternion for rotation
    rotation.setFromEuler(new THREE.Euler(Math.PI / 4, Math.PI / 4, 0)); // Set the rotation values
    matrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation));

    //Scale
    const scale = new THREE.Vector3(25, 25, 25); // Set the scale values
    matrix.scale(scale);

    return matrix;
};

const pointTopointICP = (
    source: Float32Array,
    reference: Float32Array,
    options: ICPOptions = { initialPose: IDENTITY, maxIterations: 250, tolerance: 1e-4 }
) => {
    console.log("Source: ", [...source.slice(0, 3)]);
    console.log("Reference:", [...reference.slice(0, 3)]);
    console.log("Options: ", options);
};

export { fillMat, pointTopointICP };
