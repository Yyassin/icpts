import { IDENTITY } from "../constants";
import { Mat } from "../math";
import { FlatMat, ICPOptions, ICPStrategies, ICPStrategy } from "../types";
import eig from "eigen";
import PointToPlane from "./PointToPlane";
import PointToPoint from "./PointToPoint";

export type ICPOptions_<T> = ICPOptions & {
    strategy: T;
};

/**
 * General ICP Loop
 * @author Yousef Yassin
 */
const icp_ = (source: FlatMat<number>, options: ICPOptions_<ICPStrategy>) => {
    const { initialPose = IDENTITY, maxIterations, strategy, tolerance } = options;

    // Initialize the transform from source to ref
    let transformation = Mat.fromArrayColMajor(initialPose, 4);

    // Create a 4 x N matrix containing the source points. 4
    // instead of 3 because we want to transform the points.
    const sourceMat = Mat.pointMatrix3(source);
    const sourceExtraRow = eig.Matrix.ones(sourceMat.rows() + 1, sourceMat.cols());

    // Tracks the error
    let prevError = Number.MAX_SAFE_INTEGER;
    // Tracks the consecutive times error - prevError was less than tolerance.
    let times = 0;
    // Tracks the error between the transformed source and ref.
    let error = 0;

    // Start the ICP iterations
    for (let iterCount = 0; iterCount < maxIterations; iterCount++) {
        sourceExtraRow.setBlock(0, 0, sourceMat);
        const transformedSource = transformation
            .matMul(sourceExtraRow)
            .block(0, 0, 3, sourceMat.cols());

        // Compute the optimal transform
        const res = strategy.computeOptimalTransform(transformedSource);
        const { optimalTransform } = res;
        ({ error } = res);

        // Apply the optimal transform, and update the persistent transform.
        transformation = optimalTransform.matMul(transformation);

        // Check if we can return early.
        if (Math.abs(prevError - error) < tolerance) {
            if (++times > 10) {
                break;
            }
        } else {
            times = 0;
            prevError = error;
        }

        // Free memory except for the source matrix and persistent transform
        eig.GC.pushException(sourceMat, transformation, sourceExtraRow);
        eig.GC.flush();
    }

    // Return the final transform from source to ref, and the
    // final converged error. Clear all memory.
    const flat = Mat.asFlatColMajor(transformation);
    eig.GC.popException(sourceMat, transformation, sourceExtraRow);
    eig.GC.flush();
    return { transform: flat, error };
};

const asStrategy: Record<ICPStrategies, (reference: FlatMat<number>) => ICPStrategy> = {
    PointToPlane: (reference: FlatMat<number>) => new PointToPlane(reference),
    PointToPoint: (reference: FlatMat<number>) => new PointToPoint(reference)
};

const icp = (
    source: FlatMat<number>,
    reference: FlatMat<number>,
    options: ICPOptions_<ICPStrategies>
) => {
    const strategy = asStrategy[options.strategy](reference);
    return icp_(source, { ...options, strategy });
};

export { icp };
