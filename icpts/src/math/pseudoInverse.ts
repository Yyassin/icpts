import eig from "eigen";
import { Mat } from "./Mat";
import { EPS } from "../constants";

/**
 * Calculates the Moore-Penrose pseudo inverse A^+
 * of the provided matrix A using the SVD.q If A is
 * invertible, then we return the inverse.
 * @param A The matrix to inverse.
 * @returns The pseudo inverse.
 */
const pseudoInverse = (A: eig.Matrix) => {
    // sv: The singular values in descending order
    const { U, sv, V } = eig.Decompositions.svd(A, true /* thin */);

    // Sigma is the diagonal matrix with sv as entries. To
    // take the inverse, we simply take the reciprocal of the non-zero
    // entries. Due to numerical precision, we assume small enough svs are 0.
    const svReciprocals = Mat.asFlatColMajor(sv).map((sv) => (Math.abs(sv) < EPS ? 0 : 1 / sv));
    const sigmaI = eig.Matrix.diagonal(new eig.Matrix(svReciprocals));

    // For any matrix A with svd given by A = USV^T, the
    // pseudoInverse A^{-1} is always defined and given by
    // VS^{-1}U^T. Recall that V, U are orthonormal st.
    // their inverses are given by their transpose.
    const pseudoInverse = V.matMul(sigmaI).matMul(U.transpose());
    return Mat.asFlatColMajor(pseudoInverse);
};

export { pseudoInverse };
