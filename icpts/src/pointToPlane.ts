// https://www.comp.nus.edu.sg/~lowkl/publications/lowk_point-to-plane_icp_techrep.pdf

import eig from "eigen";
import { ICPOptions, IDENTITY, Point, createPointCloudMat } from "./icp";
import { matrixHelpers } from "./matrixHelpers";
import { chunkArray } from "./util";
import { kdTree } from "kd-tree-javascript";
import { pca, pseudoInverse } from "./pca";

// Create icp.ready; that callers await. Cache matrices -> dp, proxy.
// Create pool, free at end of all iterations

const flatFromEulerZYX = (z: number, y: number, x: number) => {
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

type indexedPoint = Point & { i: number };
const computeOptimalTransform = async (
    sourceMat: eig.Matrix,
    correspondences: eig.Matrix,
    indices: number[],
    normals: number[]
) => {
    const N = sourceMat.cols();
    const b = new eig.Matrix(N, 1);
    const A = new eig.Matrix(N, 6);

    const sourceFlat = matrixHelpers.matToFlat(sourceMat);
    const correspondencesFlat = matrixHelpers.matToFlat(correspondences);

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
        n.set(0, 0, normals[refIdx * 3]);
        n.set(1, 0, normals[refIdx * 3 + 1]);
        n.set(2, 0, normals[refIdx * 3 + 2]);

        b.set(i, 0, n.transpose().matMul(d).matSub(n.transpose().matMul(s)).get(0, 0));
        A.set(i, 0, n.get(2, 0) * s.get(1, 0) - n.get(1, 0) * s.get(2, 0));
        A.set(i, 1, n.get(0, 0) * s.get(2, 0) - n.get(2, 0) * s.get(0, 0));
        A.set(i, 2, n.get(1, 0) * s.get(0, 0) - n.get(0, 0) * s.get(1, 0));
        A.set(i, 3, n.get(0, 0));
        A.set(i, 4, n.get(1, 0));
        A.set(i, 5, n.get(2, 0));
    }

    const pseudoAFlat = await pseudoInverse(A);
    const pseudoA = matrixHelpers.fromArrayCol(pseudoAFlat, A.cols()); // will have Xcol rows

    const x = pseudoA.matMul(b); // \alpha \beta \gamma t_x t_y t_z
    const error = A.matMul(x).matSub(b).normSqr();
    const [alpha, beta, gamma, tx, ty, tz] = [...Array(6).keys()].map((i) => x.get(i, 0));
    const tFlat = flatFromEulerZYX(gamma, beta, alpha);
    // last column
    tFlat[12] = tx;
    tFlat[13] = ty;
    tFlat[14] = tz;
    return { tFlat, error };
};

const computeNormals = async (
    reference: Float32Array,
    tree: kdTree<indexedPoint>,
    numNeighbours = 20
) => {
    const normals = [];
    for (let i = 0; i < reference.length; i += 3) {
        const point = { x: reference[i], y: reference[i + 1], z: reference[i + 2], i: 0 };
        const nearest = tree.nearest(point, numNeighbours);
        const nearestFlat = nearest.flatMap(([{ x, y, z }]) => [x, y, z]);
        const normal = await pca(nearestFlat);
        normals.push(...normal);
    }
    return normals;
};

const getCorrespondences = (sourceMat: eig.Matrix, kdTree: kdTree<indexedPoint>) => {
    const correspondences = new eig.Matrix(3, sourceMat.cols());
    const indices = [];

    let errorSum = 0;
    for (let i = 0; i < sourceMat.cols(); i++) {
        const point = matrixHelpers.matToFlat(sourceMat.block(0, i, 3, 1));
        const [[{ x, y, z, i: idx }, dist]] = kdTree.nearest(
            { x: point[0], y: point[1], z: point[2], i: 0 },
            1
        );

        errorSum += dist;

        correspondences.set(0, i, x);
        correspondences.set(1, i, y);
        correspondences.set(2, i, z);
        indices.push(idx);
    }

    return { correspondences, error: errorSum / sourceMat.cols(), indices };
};

const pointToPlaneICP = async (
    source: Float32Array,
    reference: Float32Array,
    options: ICPOptions = { initialPose: IDENTITY, maxIterations: 250, tolerance: 1e-4 }
) => {
    await eig.ready;
    const { initialPose, maxIterations, tolerance } = options;

    const sourceMat = createPointCloudMat(source);
    let transformation = matrixHelpers.fromArray(initialPose, 4);

    const refPoints = chunkArray(reference, 3).map(
        (point, idx) =>
            ({
                x: point[0],
                y: point[1],
                z: point[2],
                i: idx
            } as indexedPoint)
    );
    const dist = (a: Point, b: Point) =>
        Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
    const tree = new kdTree(refPoints, dist, ["x", "y", "z", "i"]);

    const sourceExtraRow = eig.Matrix.ones(sourceMat.rows() + 1, sourceMat.cols());
    const referenceNormals = await computeNormals(reference, tree, 20);

    let prevError = Number.MAX_SAFE_INTEGER;
    let times = 0;
    for (let iterCount = 0; iterCount < maxIterations; iterCount++) {
        sourceExtraRow.setBlock(0, 0, sourceMat);
        const transformedSource = transformation
            .matMul(sourceExtraRow)
            .block(0, 0, 3, sourceMat.cols());
        const { correspondences, indices } = getCorrespondences(transformedSource, tree);
        const { tFlat: optimalTransform, error } = await computeOptimalTransform(
            transformedSource,
            correspondences,
            indices,
            referenceNormals
        );
        const optimalTransformMat = matrixHelpers.fromArrayCol(optimalTransform, 4);
        transformation = transformation.matMul(optimalTransformMat);

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

export const icp = { pointToPlaneICP } as const;
