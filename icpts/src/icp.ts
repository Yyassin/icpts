import eig from "eigen";
import { matrixHelpers } from "./matrixHelpers";
import { chunkArray } from "./util";
import { kdTree } from "kd-tree-javascript";

// https://github.com/niosus/notebooks/blob/master/icp.ipynb
// Try this too

/**
 * ICP utilities
 */

export type Point = { x: number; y: number; z: number };
export type ICPOptions = {
    initialPose: number[];
    maxIterations: number;
    tolerance: number;
};
export const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export const createPointCloudMat = (points: Float32Array) => {
    const numPoints = points.length / 3;
    const pointCloudMat = new eig.Matrix(3, numPoints);

    for (let i = 0; i < numPoints; i++) {
        pointCloudMat.set(0, i, points[i * 3]);
        pointCloudMat.set(1, i, points[i * 3 + 1]);
        pointCloudMat.set(2, i, points[i * 3 + 2]);
    }

    return pointCloudMat;
};

export const getCorrespondences = (sourceMat: eig.Matrix, kdTree: kdTree<Point>) => {
    const correspondences = new eig.Matrix(3, sourceMat.cols());

    let errorSum = 0;
    for (let i = 0; i < sourceMat.cols(); i++) {
        const point = matrixHelpers.matToFlat(sourceMat.block(0, i, 3, 1));
        const [[{ x, y, z }, dist]] = kdTree.nearest({ x: point[0], y: point[1], z: point[2] }, 1);

        errorSum += dist;

        correspondences.set(0, i, x);
        correspondences.set(1, i, y);
        correspondences.set(2, i, z);
    }

    return { correspondences, error: errorSum / sourceMat.cols() };
};

export const repeatVector = (vector: eig.Matrix, numColumns: number) => {
    const repeatedMatrix = new eig.Matrix(vector.rows(), numColumns);

    for (let col = 0; col < numColumns; col++) {
        repeatedMatrix.setBlock(0, col, vector);
    }

    return repeatedMatrix;
};

const computeOptimalTransform = (sourceMat: eig.Matrix, correspondences: eig.Matrix) => {
    const vec1 = new eig.Matrix(new Array(sourceMat.cols()).fill(1));
    const npoints = sourceMat.cols();

    const centroidSource = sourceMat.matMul(vec1).div(npoints);
    const centroidCorrespondences = correspondences.matMul(vec1).div(npoints);

    const centeredSource = sourceMat.matSub(repeatVector(centroidSource, npoints));
    const centeredCorrespondence = correspondences.matSub(
        repeatVector(centroidCorrespondences, npoints)
    );

    const N = centeredSource.matMul(centeredCorrespondence.transpose());

    const svd = eig.Decompositions.svd(N, false);

    const U = svd.U;
    const V = svd.V;

    let R = V.matMul(U.transpose());

    // Special reflection case
    if (R.det() < 0) {
        // Change sign of third column
        V.setBlock(0, 2, V.block(0, 2, 3, 1).mul(-1));
        R = V.matMul(U.transpose());
    }

    const translation = centroidCorrespondences.matSub(R.matMul(centroidSource));

    // Create the affine transform
    const transform = eig.Matrix.identity(4, 4);
    transform.setBlock(0, 0, R);
    transform.setBlock(0, 3, translation);

    return transform;
};

const pointToPointICP = async (
    source: Float32Array,
    reference: Float32Array,
    options: ICPOptions = { initialPose: IDENTITY, maxIterations: 250, tolerance: 1e-4 }
) => {
    await eig.ready;
    const { initialPose, maxIterations, tolerance } = options;

    const sourceMat = createPointCloudMat(source);
    let transformation = matrixHelpers.fromArray(initialPose, 4);

    const refPoints = chunkArray(reference, 3).map(
        (point) =>
            ({
                x: point[0],
                y: point[1],
                z: point[2]
            } as Point)
    );
    const dist = (a: Point, b: Point) =>
        Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
    const tree = new kdTree(refPoints, dist, ["x", "y", "z"]);

    const sourceExtraRow = eig.Matrix.ones(sourceMat.rows() + 1, sourceMat.cols());

    let prevError = Number.MAX_SAFE_INTEGER;
    let times = 0;
    for (let iterCount = 0; iterCount < maxIterations; iterCount++) {
        sourceExtraRow.setBlock(0, 0, sourceMat);
        const transformedSource = transformation
            .matMul(sourceExtraRow)
            .block(0, 0, 3, sourceMat.cols());
        const { correspondences, error } = getCorrespondences(transformedSource, tree);
        const optimalTransform = computeOptimalTransform(transformedSource, correspondences);
        transformation = transformation.matMul(optimalTransform);

        if (Math.abs(prevError - error) < tolerance) {
            transformedSource.block(0, 0, 3, 10).print("Source");
            correspondences.block(0, 0, 3, 10).print("Correspondence");
            if (++times > 10) {
                break;
            }
        } else {
            times = 0;
            prevError = error;
        }
        eig.GC.pushException(sourceMat, transformation, sourceExtraRow);
        eig.GC.flush();
    }

    transformation.print("transform");
    const flat = matrixHelpers.matToFlat(transformation);
    eig.GC.popException(sourceMat, transformation, sourceExtraRow);
    eig.GC.flush();
    return flat;
};

export const icp = { pointToPointICP } as const;
