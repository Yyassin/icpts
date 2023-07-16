import eig from "eigen";
import { IDENTITY } from "../src/constants";
import { Mat } from "../src/math";
import { FlatMat, ICPOptions } from "../src/types";
import { pointToPlane, pointToPoint } from "../src/icp";

const printMatrix = (matrixArray: number[]) => {
    if (matrixArray.length !== 16) {
        console.error("Invalid input: The array must contain exactly 16 elements.");
        return;
    }

    for (let i = 0; i < 4; i++) {
        let row = "";
        for (let j = 0; j < 4; j++) {
            const index = j * 4 + i; // Adjust index for column-major order
            row += matrixArray[index] + "\t";
        }
        console.log(row);
    }
};

const sinusoidPoints = (n: number) => {
    const points = [];
    const incr = Math.PI / n;
    let x = 0;
    while (x < 2 * Math.PI) {
        points.push(x, Math.sin(x), 0);
        x += incr;
    }
    return points;
};

type ICPStrategy = (
    source: FlatMat<number>,
    reference: FlatMat<number>,
    options: ICPOptions
) => { transform: FlatMat<number>; error: number };
const testMethod = (strategy: ICPStrategy) => {
    const source = sinusoidPoints(200);
    const transform_ = Mat.flatRotationFromEulerZYX(Math.PI / 12, Math.PI / 12, Math.PI / 12);

    const t = [0.45, 0.2, 0];
    // Add the translation as the last column
    transform_[12] = t[0];
    transform_[13] = t[1];
    transform_[14] = t[2];

    const transformMat = Mat.fromArrayColMajor(transform_, 4);

    const sourceMat = Mat.pointMatrix4(source);
    const referenceMat = transformMat.matMul(sourceMat).block(0, 0, 3, sourceMat.cols());
    const reference = Mat.asFlatColMajor(referenceMat);
    Mat.flush();

    const options = {
        initialPose: IDENTITY,
        tolerance: 1e-10,
        maxIterations: 50
    };

    const { transform, error } = strategy(source, reference, options);
    console.log("\nExpected:");
    printMatrix(transform_);
    console.log("\nActual:");
    printMatrix(transform as number[]);
    console.log("\nError:", error);
};

(async () => {
    await eig.ready;
    console.log("=== Testing PointToPlane ===");
    testMethod(pointToPlane);
    Mat.flush();

    console.log("=== Testing PointToPoint ===");
    testMethod(pointToPoint);
    Mat.flush();
})();
