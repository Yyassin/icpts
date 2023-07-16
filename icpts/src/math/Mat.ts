import eig from "eigen";
import { chunkArray } from "../util";
import { FlatMat } from "../types";

/**
 * Static Matrix class that wraps eigen with
 * various helper methods.
 * @author Yousef Yassin
 */

class Mat {
    /**
     * Creates a matrix with {cols} columns with
     * elements corresponding to those in the supplied
     * flat array, assuming row major order.
     * We must have that flat.length is divisible by cols.
     * @param flat The elements in the matrix, in row major order.
     * @param cols The number of columns in the matrix to construct.
     * @returns The matrix
     */
    public static fromArrayRowMajor = (flat: FlatMat<number>, cols: number) => {
        const rows = chunkArray(flat, cols);
        return new eig.Matrix(rows as unknown as number[]);
    };

    /**
     * Creates a matrix with {rows} rows with
     * elements corresponding to those in the supplied
     * flat array, assuming column major order.
     * We must have that flat.length is divisible by rows.
     * @param flat The elements in the matrix, in column major order.
     * @param cols The number of rows in the matrix to construct.
     * @returns The matrix
     */
    public static fromArrayColMajor = (flat: FlatMat<number>, rows: number) => {
        const cols = chunkArray(flat, rows);
        return new eig.Matrix(cols as unknown as number[]).transpose();
    };

    /**
     * Provided a flat list of N cartesian points in three dimensional
     * space, creates a matrix of size 3xN containing the points.
     * @param points The points to construct a matrix for.
     * @returns The matrix.
     */
    public static pointMatrix3 = (points: FlatMat<number>) => {
        const numPoints = points.length / 3;
        // Create an empty Eigen.Matrix object with dimensions 4xN
        const mat = new eig.Matrix(3, numPoints);
        // And fill it
        for (let i = 0; i < numPoints; i++) {
            mat.set(0, i, points[i * 3]);
            mat.set(1, i, points[i * 3 + 1]);
            mat.set(2, i, points[i * 3 + 2]);
        }
        return mat;
    };

    /**
     * Provided a flat list of N cartesian points in three dimensional
     * space, creates a matrix of size 4xN containing the points
     * for simplified transformation.
     * @param points The points to construct a matrix for.
     * @returns The matrix.
     */
    public static pointMatrix4 = (points: FlatMat<number>) => {
        const numPoints = points.length / 3;
        // Create an empty Eigen.Matrix object with dimensions 4xN
        const mat = new eig.Matrix(4, numPoints);
        // And fill it
        for (let i = 0; i < numPoints; i += 3) {
            mat.set(0, i, points[i * 3]);
            mat.set(1, i, points[i * 3 + 1]);
            mat.set(2, i, points[i * 3 + 2]);
            mat.set(3, i, 1);
        }
        return mat;
    };

    /**
     * Flattens a matrix into a array using
     * column major order.
     * @param mat The matrix to flatten.
     * @returns The flattened matrix.
     */
    public static asFlatColMajor = (mat: eig.Matrix) => {
        const flatMat = [];
        const col = new Array<number>(mat.rows());
        // For each column.
        for (let i = 0; i < mat.cols(); i++) {
            // For each row
            for (let j = 0; j < mat.rows(); j++) {
                col[j] = mat.get(j, i);
            }
            flatMat.push(...col);
        }
        return flatMat;
    };

    /**
     * Creates a matrix with the provided vector repeated
     * {cols} times.
     * @param vector The vector to repeat.
     * @param cols The number of repeats. Also the number
     * of columns in the resulting matrix.
     * @returns The matrix.
     */
    public static repeatVector = (vector: eig.Matrix, cols: number) => {
        const repeatedMatrix = new eig.Matrix(vector.rows(), cols);
        for (let col = 0; col < cols; col++) {
            repeatedMatrix.setBlock(0, col, vector);
        }
        return repeatedMatrix;
    };

    /**
     * Returns the rotation matrix defined by the provided
     * euler rotation (ZYX order) in column major order.
     * @param z Yaw
     * @param y Pitch
     * @param x Roll
     */
    public static flatRotationFromEulerZYX = (z: number, y: number, x: number) => {
        // Source: https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
        const te = [];
        const a = Math.cos(x),
            b = Math.sin(x);
        const c = Math.cos(y),
            d = Math.sin(y);
        const e = Math.cos(z),
            f = Math.sin(z);
        const ae = a * e,
            af = a * f,
            be = b * e,
            bf = b * f;

        te[0] = c * e;
        te[4] = be * d - af;
        te[8] = ae * d + bf;

        te[1] = c * f;
        te[5] = bf * d + ae;
        te[9] = af * d - be;

        te[2] = -d;
        te[6] = b * c;
        te[10] = a * c;

        // bottom row
        te[3] = 0;
        te[7] = 0;
        te[11] = 0;

        // last column
        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return te;
    };

    /** Garbage collection methods from Eigen */
    public static flush = eig.GC.flush;
    public static pop = eig.GC.popException;
    public static push = eig.GC.pushException;
}

export { Mat };
