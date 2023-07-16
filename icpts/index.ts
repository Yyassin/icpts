import eig from "eigen";
import { pointToPlane, pointToPoint } from "./src/icp";
import { Mat } from "./src/math";

const icpts = {
    pointToPoint,
    pointToPlane,
    ready: eig.ready,
    Mat
};

export default icpts;
