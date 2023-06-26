import eig from "eigen";
import createKDTree from "static-kdtree";
import { matrixHelpers } from "./matrixHelpers";
import { chunkArray } from "./util";
import { SVD } from "svd-js";

type KDTree = ReturnType<typeof import("static-kdtree")>;

/**
 * ICP utilities
 */

export type ICPOptions = {
    initialPose: number[];
    maxIterations: number;
    tolerance: number;
};
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const createPointCloudMat = (points: Float32Array) => {
    const numPoints = points.length / 3;
    const pointCloudMat = new eig.Matrix(3, numPoints);

    for (let i = 0; i < numPoints; i++) {
        pointCloudMat.set(0, i, points[i * 3]);
        pointCloudMat.set(1, i, points[i * 3 + 1]);
        pointCloudMat.set(2, i, points[i * 3 + 2]);
    }

    return pointCloudMat;
};

// TODO: use get/set blocks
const getCorrespondences = (sourceMat: eig.Matrix, reference: number[][], kdTree: KDTree) => {
    const correspondences = new eig.Matrix(3, sourceMat.cols());

    for (let i = 0; i < sourceMat.cols(); i++) {
        const point = matrixHelpers.matToFlat(sourceMat.block(0, i, 3, 1));
        const correspondenceIdx = kdTree.nn(point);

        correspondences.set(0, i, reference[correspondenceIdx][0]);
        correspondences.set(1, i, reference[correspondenceIdx][1]);
        correspondences.set(2, i, reference[correspondenceIdx][2]);
    }

    return correspondences;
};

const repeatVector = (vector: eig.Matrix, numColumns: number) => {
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

    // const Nflat = matrixHelpers.matToFlat(N);
    // const { u, v } = SVD(chunkArray(Nflat, N.cols()) as number[][]);
    const svd = eig.Decompositions.svd(N, true); // potential bug

    const U = svd.U; //new eig.Matrix(u);
    const V = svd.V; //new eig.Matrix(v);

    // console.log(U.rows(), U.cols());
    // console.log(V.rows(), V.cols());

    let R = V.matMul(U.transpose());

    // TODO: det lib, or get a different lib

    // console.log(R.rows(), R.cols());
    // console.log(centroidSource.rows(), centroidSource.cols());

    // Special reflection case
    // if (R.det() < 0) {
    //     // Change sign of third column
    //     V.setBlock(0, 2, V.block(0, 2, 3, 1).mul(-1));
    //     R = V.matMul(U.transpose());
    // }

    const translation = centroidCorrespondences.matSub(R.matMul(centroidSource));

    // Create the affine transform
    const transform = new eig.Matrix(4, 4);
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
    const { initialPose, maxIterations, tolerance: _tol } = options;

    const sourceMat = createPointCloudMat(source);
    let transformation = matrixHelpers.fromArray(initialPose, 4);

    const chunkedRef = chunkArray(reference, 3) as number[][];
    const kdTree = createKDTree(chunkedRef);

    const sourceExtraRow = eig.Matrix.ones(sourceMat.rows() + 1, sourceMat.cols());

    for (let iterCount = 0; iterCount < maxIterations; iterCount++) {
        sourceExtraRow.setBlock(0, 0, sourceMat);
        const transformedSource = transformation
            .matMul(sourceExtraRow)
            .block(0, 0, 3, sourceMat.cols());
        const correspondences = getCorrespondences(transformedSource, chunkedRef, kdTree);
        const optimalTransform = computeOptimalTransform(transformedSource, correspondences);
        transformation = transformation.matMul(optimalTransform);

        // eig.GC.pushException(sourceMat, transformation);
        // eig.GC.flush();
    }

    // TODO: implement tol, use a kdtree lib to get distances

    const flat = matrixHelpers.matToFlat(transformation);
    // eig.GC.popException(transformation);
    // eig.GC.flush();
    return flat;
};

export const icp = { pointToPointICP } as const;
