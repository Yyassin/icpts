import { matrixHelpers } from "./src/matrixHelpers";
import { icp as pointICP } from "./src/icp";
import { icp as planeICP } from "./src/pointToPlane";

const icp = { pointToPoint: pointICP.pointToPointICP, pointToPlane: planeICP.pointToPlaneICP };

export { matrixHelpers, icp };

// ncc build index.ts -o dist --target es2017
