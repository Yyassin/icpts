import eig from "eigen";
import { FlatMat, ICPStrategy, Point } from "../types";
import { chunkArray } from "../util";
import { kdTree } from "kd-tree-javascript";
import { Mat } from "../math";

// References: [1] https://igl.ethz.ch/projects/ARAP/svd_rot.pdf
// [2] Least Squares Fitting of Two 3-D Point Sets <linked in repo>

/**
 * Implementation of point to point ICP
 * @author Yousef Yassin
 */
class PointToPoint implements ICPStrategy {
    /**
     * KDTree for correspondence lookup.
     */
    #kdTree: kdTree<Point>;

    /**
     * Initializes new Point To Plane strategy
     * with the provided reference cloud.
     * @param reference The reference cloud.
     */
    constructor(reference: FlatMat<number>) {
        this.#kdTree = this.#initKdTree(reference);
    }

    /**
     * Initializes the KDTree with the points
     * in the supplied reference cloud.
     * @param reference The reference cloud
     * @returns The initialized KDTree.
     */
    #initKdTree(reference: FlatMat<number>) {
        // Chunk the reference points by point, and add an index indicator
        // for easy normals retrieval following a KD-tree query.
        const refPoints = chunkArray(reference, 3).map(
            (point, idx) =>
                ({
                    x: point[0],
                    y: point[1],
                    z: point[2]
                } as Point)
        );

        // Euclidean distance metric for the KD-Tree KNN search
        const dist = (a: Point, b: Point) =>
            Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
        // KD-tree to get correspondences.
        return new kdTree(refPoints, dist, ["x", "y", "z"]);
    }

    /**
     * Returns a matrix of point correspondences for
     * each column (point) in the supplied source
     * cloud matrix. The average distance
     * between correspondences is returned as
     * an error proxy.
     * @param sourceMat The source cloud matrix
     * @returns The matrix of correspondences and the
     * average error.
     */
    #getCorrespondences(sourceMat: eig.Matrix) {
        const correspondences = new eig.Matrix(3, sourceMat.cols());

        let errorSum = 0;
        for (let i = 0; i < sourceMat.cols(); i++) {
            const point = Mat.asFlatColMajor(sourceMat.block(0, i, 3, 1));
            const [[{ x, y, z }, dist]] = this.#kdTree.nearest(
                { x: point[0], y: point[1], z: point[2] },
                1
            );

            errorSum += dist;

            correspondences.set(0, i, x);
            correspondences.set(1, i, y);
            correspondences.set(2, i, z);
        }

        return { correspondences, error: errorSum / sourceMat.cols() };
    }

    /**
     * Computes the optimal rigid body transformation between
     * the supplied source matrix to the reference using the
     * Point to Point metric (read the paper, it's in there),
     * @param sourceMat The source matrix.
     * @returns The optimal transform and current error.
     */
    public computeOptimalTransform(sourceMat: eig.Matrix) {
        const { correspondences, error } = this.#getCorrespondences(sourceMat);

        // First, we center both clouds by their centroids. We compute
        // the means by summing across columns and dividing by the number
        // of columns. This is done using matrix multiplication below
        const vecOnes = new eig.Matrix(new Array(sourceMat.cols()).fill(1));
        const npoints = sourceMat.cols();

        // Compute centroids
        const centroidSource = sourceMat.matMul(vecOnes).div(npoints);
        const centroidCorrespondences = correspondences.matMul(vecOnes).div(npoints);

        // Center the source and correspondence cloud
        const centeredSource = sourceMat.matSub(Mat.repeatVector(centroidSource, npoints));
        const centeredCorrespondence = correspondences.matSub(
            Mat.repeatVector(centroidCorrespondences, npoints)
        );

        // Compute the optimal transform, the proof for the equations
        // below is linked in source [2] above.
        const N = centeredSource.matMul(centeredCorrespondence.transpose());

        const { U, V } = eig.Decompositions.svd(N, false);

        let R = V.matMul(U.transpose());

        // Special reflection case
        if (R.det() < 0) {
            // Change sign of third column
            V.setBlock(0, 2, V.block(0, 2, 3, 1).mul(-1));
            R = V.matMul(U.transpose());
        }

        // Translation is difference between the centroids following
        // rotation of the source centroid.
        const translation = centroidCorrespondences.matSub(R.matMul(centroidSource));

        // Create the affine transform
        const optimalTransform = eig.Matrix.identity(4, 4);
        optimalTransform.setBlock(0, 0, R);
        optimalTransform.setBlock(0, 3, translation);

        return { optimalTransform, error };
    }
}

export default PointToPoint;
