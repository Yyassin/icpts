import eig from "eigen";
import { Mat, estimateNormal } from "../src/math";
import { createPoints } from "./createPoints";

/**
 * Normalizes the provided 3D vector
 * @param v The vector to normalize
 * @returns The normalize vector.
 */
const unitize = (v: number[]) => {
    const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return v.map((v) => v / mag);
};

const normal = [2, -1, 4];
const points = createPoints(normal, 7, 0);
(async () => {
    await eig.ready;
    const normalEstimate = estimateNormal(points);
    console.log(normalEstimate);
    console.log("Expected");
    console.log(unitize(normal));
    Mat.flush();
})();
