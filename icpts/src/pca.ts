/**
 * Implements PCA for a n x p sized matrix
 * where n is the number of samples and
 * p is the number of variables.
 */

// https://stats.stackexchange.com/questions/134282/relationship-between-svd-and-pca-how-to-use-svd-to-perform-pca

import eig from "eigen";
import { createPointCloudMat, repeatVector } from "./icp";
import { FlatArray } from "./types";
import { matrixHelpers } from "./matrixHelpers";

export const pca = async (points: FlatArray<number>) => {
    await eig.ready;
    /**
     * Construct the covariance matrix
     */
    // Calculate the mean of the points and center X
    const X = createPointCloudMat(points as Float32Array); // (p, n)
    const n = X.cols();

    const vec1 = new eig.Matrix(new Array(n).fill(1));
    const mean = X.matMul(vec1).div(n);

    // This is now a centered X matrix with points as rows
    X.matSubSelf(repeatVector(mean, n)).transposeSelf(); // (n, p)

    // Compute the SVD
    const svd = eig.Decompositions.svd(X, true);
    const [V, sv] = [svd.V, svd.sv];

    // If X = USV^T then the columns of V are principle
    // directions (eigenvectors)
    sv.print("sv");
    V.print("V");

    // Singular values are sorted in decreasing order
    // so the smallest is always the last which
    // means the estimated normal for this set of
    // points is given by the right most column in V
    const normal = V.block(0, 2, 3, 1);
    const normalFlat = matrixHelpers.matToFlat(normal);
    eig.GC.flush();
    return normalFlat;
};

export const pseudoInverse = async (A: eig.Matrix) => {
    await eig.ready;
    const svd = eig.Decompositions.svd(A, true);

    const eps = 1e-15;

    const reciprocalSv = matrixHelpers
        .matToFlat(svd.sv)
        .map((sv) => (Math.abs(sv) < eps ? 0 : 1 / sv));

    const sigmaInverse = eig.Matrix.diagonal(new eig.Matrix(reciprocalSv));

    const pseudoInverse = svd.V.matMul(sigmaInverse).matMul(svd.U.transpose());

    const flat = matrixHelpers.matToFlat(pseudoInverse);
    // eig.GC.flush();

    return flat;
};
