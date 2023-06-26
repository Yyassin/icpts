import * as THREE from "three";

/**
 * ICP utilities
 */

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

export { fillMat };
