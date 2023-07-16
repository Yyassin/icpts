import { FlatMat, ICPOptions } from "../types";
import { icp } from "./icp";

const pointToPoint = (source: FlatMat<number>, reference: FlatMat<number>, options: ICPOptions) =>
    icp(source, reference, { ...options, strategy: "PointToPoint" });
const pointToPlane = (source: FlatMat<number>, reference: FlatMat<number>, options: ICPOptions) =>
    icp(source, reference, { ...options, strategy: "PointToPlane" });

export { pointToPoint, pointToPlane };
