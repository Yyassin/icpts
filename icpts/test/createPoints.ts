/**
 * Computes the cross product between two 3D vectors a and b.
 * @param a The first vector
 * @param b The second vector
 * @returns The cross product
 */
const crossProduct = (a: number[], b: number[]): number[] => {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};

/**
 * Provided a normal for a plane, returns {range} points
 * on this plane, perturbed by some noise.
 * @param normal The plane normal
 * @param range The number of points to generate
 * @param noiseFactor Scaling for the noise.
 * @returns The points.
 */
export const createPoints = (normal: number[], range: number, noiseFactor: number = 0) => {
    // Find two orthogonal vectors on the plane
    const v1 = [normal[1], -normal[0], 0];
    const v2 = crossProduct(normal, v1);

    // Generate points on the plane
    const points: number[] = [];
    for (let i = -range; i <= range; i++) {
        for (let j = -range; j <= range; j++) {
            const x = v1[0] * i + v2[0] * j + noiseFactor * Math.random();
            const y = v1[1] * i + v2[1] * j + noiseFactor * Math.random();
            const z = v1[2] * i + v2[2] * j + noiseFactor * Math.random();
            points.push(x, y, z);
        }
    }

    return points;
};
