import eig from "eigen";
import { pseudoInverse } from "../src/pca";
import { matrixHelpers } from "../src/matrixHelpers";

const calculateRegressionPseudo = async (points: number[][]) => {
    await eig.ready;
    const n = points.length;

    // Design matrix n x p
    const X = new eig.Matrix(n, 2);
    for (let i = 0; i < n; i++) {
        X.set(i, 0, 1);
        X.set(i, 1, points[i][0]);
    }

    // Response n x 1
    const Y = new eig.Matrix(n, 1);
    for (let i = 0; i < n; i++) {
        Y.set(i, 0, points[i][1]);
    }

    // We want to solve XB = Y => B = (X^+)Y or B = (X^TX)^{-1}X^TY

    const pseudoInvXFlat = await pseudoInverse(X);
    const pseudoInvX = matrixHelpers.fromArrayCol(pseudoInvXFlat, X.cols()); // will have Xcol rows

    const beta = pseudoInvX.matMul(Y);

    const b0 = beta.get(0, 0);
    const b1 = beta.get(1, 0);

    // eig.GC.flush();

    return { b0, b1 };
};

const calculateRegressionStats = (points: number[][]) => {
    const n = points.length;
    let sumX: number = 0,
        sumY: number = 0,
        sumX2: number = 0,
        sumXY: number = 0;
    points.forEach(([x, y]) => {
        sumX += x;
        sumY += y;
        sumX2 += x * x;
        sumXY += x * y;
    });

    const sxx = sumX2 - (sumX * sumX) / n;
    const sxy = sumXY - (sumX * sumY) / n;

    const b1 = sxy / sxx;
    const b0 = sumY / n - b1 * (sumX / n);
    return { b0, b1 };
};

const points = [
    [1, 2],
    [2, 4],
    [3, 6],
    [4, 8],
    [5, 10],
    [4, 5],
    [2, 4.3],
    [15, 20],
    [20, 40]
];

(async () => {
    const { b0: b0e, b1: b1e } = calculateRegressionStats(points);
    const { b0: b0a, b1: b1a } = await calculateRegressionPseudo(points);

    console.log(`b0e: ${b0e}, b1e: ${b1e}, b0a: ${b0a}, b1a: ${b1a}`);
})();
