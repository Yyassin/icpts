import { kdTree } from "kd-tree-javascript";
import { FlatMat, ICPStrategy, IndexedPoint, Point } from "../types";
import { chunkArray } from "../util";
import { Mat, estimateNormal, pseudoInverse } from "../math";
import eig from "eigen";

// Reference: https://www.comp.nus.edu.sg/~lowkl/publications/lowk_point-to-plane_icp_techrep.pdf

/**
 * Implementation of Point to Plane ICP
 * @author Yousef Yassin
 */
class PointToPlane implements ICPStrategy {
    /**
     * KDTree for correspondence lookup
     * and also used for KNN when computing
     * normals
     */
    #kdTree: kdTree<IndexedPoint>;
    /**
     * Stores the estimated normal
     * vector at each point in the reference cloud.
     */
    #refNormals: FlatMat<number>;

    /**
     * Initializes new Point To Plane strategy
     * with the provided reference cloud.
     * @param reference The reference cloud.
     */
    constructor(reference: FlatMat<number>) {
        this.#kdTree = this.#initKdTree(reference);
        this.#refNormals = this.#initNormals(reference);
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
                    z: point[2],
                    i: idx
                } as IndexedPoint)
        );

        // Euclidean distance metric for the KD-Tree KNN search
        const dist = (a: Point, b: Point) =>
            Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
        // KD-tree to get correspondences.
        return new kdTree(refPoints, dist, ["x", "y", "z", "i"]);
    }

    /**
     * Computes and returns the estimated normal
     * vectors at each point in the specified reference
     * cloud.
     * @param reference The reference cloud.
     * @param numNeighbours The number of neighbours
     * to use for the normal estimation.
     * @returns The normals.
     */
    #initNormals(reference: FlatMat<number>, numNeighbours = 20) {
        const normals = [];
        for (let i = 0; i < reference.length; i += 3) {
            const point = { x: reference[i], y: reference[i + 1], z: reference[i + 2], i: 0 };
            const nearest = this.#kdTree.nearest(point, numNeighbours);
            const nearestFlat = nearest.flatMap(([{ x, y, z }]) => [x, y, z]);
            const normal = estimateNormal(nearestFlat);
            normals.push(...normal);
        }
        return normals;
    }

    /**
     * Returns a matrix of point correspondences for
     * each column (point) in the supplied source
     * cloud matrix. The index of each correspondence
     * is also returned for normal retrieval and the
     * average distance between correspondence is
     * returned as an error proxy.
     * @param sourceMat The source cloud matrix
     * @returns The matrix of correspondences, their
     * indices and the average error.
     */
    #getCorrespondences(sourceMat: eig.Matrix) {
        const correspondences = new eig.Matrix(3, sourceMat.cols());
        const indices = [];

        let errorSum = 0;
        for (let i = 0; i < sourceMat.cols(); i++) {
            // The ith point is the ith column
            const point = Mat.asFlatColMajor(sourceMat.block(0, i, 3, 1));
            // Query for the closest reference point, and its index
            // which we'll use to get the associate estimated normal
            // at this position.
            const [[{ x, y, z, i: idx }, dist]] = this.#kdTree.nearest(
                { x: point[0], y: point[1], z: point[2], i: 0 },
                1
            );

            // Update the error with
            // the distance between correspondences.
            errorSum += dist;

            // Set the correspondences mat
            correspondences.set(0, i, x);
            correspondences.set(1, i, y);
            correspondences.set(2, i, z);
            indices.push(idx);
        }

        // We average the error before returning
        return { correspondences, error: errorSum / sourceMat.cols(), indices };
    }

    /**
     * Computes the optimal rigid body transformation between
     * the supplied source matrix to the reference using the
     * Point to Plane metric (read the paper, it's in there),
     * @param sourceMat The source matrix.
     * @returns The optimal transform and current error.
     */
    public computeOptimalTransform(sourceMat: eig.Matrix) {
        const { correspondences, indices } = this.#getCorrespondences(sourceMat);

        // The number of points
        const N = sourceMat.cols();

        // The rest of the operations below follow the reference paper
        // linked above verbatim. Basically, we linearize the transform
        // operation and solve for the optimal transform using
        // least-squares, using SVD.

        // Construct the A and b matrices, we will
        // solve Ax = b where x contains the rigid body
        // transform parameters.
        const b = new eig.Matrix(N, 1);
        const A = new eig.Matrix(N, 6);

        const sourceFlat = Mat.asFlatColMajor(sourceMat);
        const correspondencesFlat = Mat.asFlatColMajor(correspondences);

        const s = new eig.Matrix(3, 1);
        const d = new eig.Matrix(3, 1);
        const n = new eig.Matrix(3, 1);
        for (let i = 0; i < N; i++) {
            s.set(0, 0, sourceFlat[i * 3]);
            s.set(1, 0, sourceFlat[i * 3 + 1]);
            s.set(2, 0, sourceFlat[i * 3 + 2]);

            d.set(0, 0, correspondencesFlat[i * 3]);
            d.set(1, 0, correspondencesFlat[i * 3 + 1]);
            d.set(2, 0, correspondencesFlat[i * 3 + 2]);

            const refIdx = indices[i];
            n.set(0, 0, this.#refNormals[refIdx * 3]);
            n.set(1, 0, this.#refNormals[refIdx * 3 + 1]);
            n.set(2, 0, this.#refNormals[refIdx * 3 + 2]);

            b.set(i, 0, n.transpose().matMul(d).matSub(n.transpose().matMul(s)).get(0, 0));
            A.set(i, 0, n.get(2, 0) * s.get(1, 0) - n.get(1, 0) * s.get(2, 0));
            A.set(i, 1, n.get(0, 0) * s.get(2, 0) - n.get(2, 0) * s.get(0, 0));
            A.set(i, 2, n.get(1, 0) * s.get(0, 0) - n.get(0, 0) * s.get(1, 0));
            A.set(i, 3, n.get(0, 0));
            A.set(i, 4, n.get(1, 0));
            A.set(i, 5, n.get(2, 0));
        }

        // Solve Ax = b using SVD
        const pseudoAFlat = pseudoInverse(A);
        // Will have Xcol rows
        const pseudoA = Mat.fromArrayColMajor(pseudoAFlat, A.cols());

        // \alpha \beta \gamma t_x t_y t_z
        const x = pseudoA.matMul(b);

        // The error is NOT the distance between the
        // the clouds. Rather, it is the error in the
        // least squares estimate.
        const error = A.matMul(x).matSub(b).normSqr();

        // Extract the parameters and construct the transform
        const [alpha, beta, gamma, tx, ty, tz] = [...Array(6).keys()].map((i) => x.get(i, 0));
        const tFlat = Mat.flatRotationFromEulerZYX(gamma, beta, alpha);

        // Add the translation as the last column
        tFlat[12] = tx;
        tFlat[13] = ty;
        tFlat[14] = tz;

        // Create the 4x4 Matrix
        const optimalTransform = Mat.fromArrayColMajor(tFlat, 4);
        return { optimalTransform, error };
    }
}

export default PointToPlane;
