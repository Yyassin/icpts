import { pca } from "../src/pca";
import { createPoints } from "./createPoints";

const unitize = (v: number[]) => {
    const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return v.map((v) => v / mag);
};

const normal = [2, -1, 4];

const points = createPoints(normal, 7, 10);
(async () => {
    const n = await pca(points);
    console.log(n);
    console.log("expected");
    console.log(unitize(normal));
})();
