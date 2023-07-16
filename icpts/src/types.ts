/**
 * Defines general types
 * @author Yousef Yassin
 */

import eig from "eigen";

/**
 * Three dimensional cartesian point
 */
export type Point = { x: number; y: number; z: number };

/**
 * Point augmented with an index relative to some
 * reference array. Useful for indexing normals
 * after KD-tree queries.
 */
export type IndexedPoint = Point & { i: number };

/**
 * Generic array that includes both regular and typed arrays
 */
export type FlatMat<T> = ArrayLike<T> & { slice: (begin: number, end?: number) => FlatMat<T> };

/**
 * Generic interface for an ICP strategy
 */
export interface ICPStrategy {
    computeOptimalTransform: (sourceMat: eig.Matrix) => {
        optimalTransform: eig.Matrix;
        error: number;
    };
}

const ICPStrategies = ["PointToPoint", "PointToPlane"] as const;
export type ICPStrategies = typeof ICPStrategies[number];

/**
 * ICP Options
 * Intial Pose: The initial transform to assume from source to reference.
 * Max iterations: The maximum number of ICP iterations.
 * Tolerance: If the reduction in error between two consecutive iterations
 * is less than this value 10 times in a row, we stop early.
 */
export type ICPOptions = {
    initialPose?: FlatMat<number>;
    maxIterations: number;
    tolerance: number;
};
