import eig from "eigen";
import { FlatMat } from "../types";
import { Mat } from "./Mat";

// Source: https://stats.stackexchange.com/questions/134282/relationship-between-svd-and-pca-how-to-use-svd-to-perform-pca

/**
 * Provided a set of 3d points on a surface, computes
 * an estimate of the surface normal. We do this by assuming
 * a plane and computing the principal axis (eigenvector)
 * that corresponds to the direction of least variance.
 * @param points The points on the surface to estiamte a normal for.
 * @returns The estimated normal
 */
const estimateNormal = (points: FlatMat<number>) => {
    // Create a point matrix, size (3, n) where 3 is the
    // dimension of each point and n is the number of points.
    const X = Mat.pointMatrix3(points as Float32Array);
    const n = X.cols();

    // The mean is the sum of the points row wise, divided
    // by the number of points -- the number of columns.
    // This is achieved by right multiplication of a vector
    // of ones.
    const nvecOnes = new eig.Matrix(new Array(n).fill(1));
    const mean = X.matMul(nvecOnes).div(n);

    // The cross covariance of X is defined by
    // C = (X - X_bar)^T(X - X_bar) / (n - 1). We will proceed assuming
    // X is already centered st. C = X^TX / (n - 1). Assuming X = USV^T
    // then C = VSU^T USV^T / (n - 1) = VS^2V^T / (n - 1).

    // Center X and transpose to get an n x p matrix (C is n x n).
    X.matSubSelf(Mat.repeatVector(mean, n)).transposeSelf();
    // Compute the SVD
    const { V } = eig.Decompositions.svd(X, true);

    // The values s^2_i / (n - 1) give the eigenvalues of the matrix C.
    // The best estimate for the normal vector of the set of points corresponds
    // to the direction with the least variance (we are assuming a plane). Hence,
    // we are looking for the eigenvector associated with the smallest singular value squared.
    // Since x^2 is monotonic for x > 0, then argmin_x(x^2) = argmin_x(x). Thus,
    // we are looking for the last sv since they are stored in decreasing order.

    // The eigenvector (or principal axes) are stored in the columns of V, so the estimated
    // normal is in the last column of V. Since X^T is N x 3 then V is 3 x 3.
    const normal = V.block(0, 2, 3, 1); // Column  3
    return Mat.asFlatColMajor(normal);
};

export { estimateNormal };
