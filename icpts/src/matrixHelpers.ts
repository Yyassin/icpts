import eig from "eigen";
import { FlatArray } from "./types";
import { chunkArray } from "./util";

/**
 * Various helper functions to work with eigen
 */

/**
 *
 * @param cols
 */
const fromArray = (flatMat: FlatArray<number>, ncols: number) => {
    const byRows = chunkArray(flatMat, ncols);
    return new eig.Matrix(byRows as unknown as number[]);
};

const fromArrayCol = (flatMat: FlatArray<number>, nrows: number) => {
    const byCol = chunkArray(flatMat, nrows);
    return new eig.Matrix(byCol as unknown as number[]).transpose();
};

const flatToVec3Mat = (flatMat: FlatArray<number>) => {
    // N
    const len = flatMat.length;
    // Create an empty Eigen.Matrix object with dimensions 4xN
    const mat = new eig.Matrix(4, len / 3);
    // And fill it
    for (let i = 0; i < len; i += 3) {
        mat.set(0, i / 3, flatMat[i]);
        mat.set(1, i / 3, flatMat[i + 1]);
        mat.set(2, i / 3, flatMat[i + 2]);
        mat.set(3, i / 3, 1);
    }
    return mat;
};

// By column
const matToFlat = (mat: eig.Matrix) => {
    const flatMat = [];
    const col = new Array<number>(mat.rows());
    for (let i = 0; i < mat.cols(); i++) {
        for (let j = 0; j < mat.rows(); j++) {
            col[j] = mat.get(j, i);
        }
        flatMat.push(...col);
    }
    return flatMat;
};

const flush = eig.GC.flush;

export const matrixHelpers = {
    fromArray,
    fromArrayCol,
    flatToVec3Mat,
    matToFlat,
    flush
} as const;
