/**
 * Helper functions for dealing with .pcd files
 */

import { FlatMat } from 'icpts/dist/src/types';

/**
 * Parses a PCD line into a point scaled
 * with the provided scale factor.
 * @param line The PCD line to parse.
 * @param scale The scaling factor.
 * @returns The point.
 */
const lineToPoint3D = (line: string) =>
  line.split(' ').map((x) => 25 * Number(x));

/**
 * Checks if the specified point is a
 * valid 3d point
 * @param point The point to check
 * @returns True if valid and false otherwise.
 */
const isValidPoint = (point: number[]) => point.length === 3;

/**
 * Parses the specified pcd file
 * and returns an array of the contained points.
 * @param filename Path to the PCD file to parse (relative to /public).
 */
const parsePCDFile = async (filepath: string) => {
  const file = await fetch(filepath).then((response) => response.text());
  const lines = file.split('\n').map((line) => line.trim());

  // Iterate until we get past the metadata and to the
  // points (usually line 11, but we'll be more robust).
  let pointsStartIndex = 0;
  while (!lines[pointsStartIndex++].startsWith('DATA'));
  // The points start on the next line after DATA.
  pointsStartIndex++;

  // Extract each valid euclidean point (3D)
  return lines.slice(pointsStartIndex).map(lineToPoint3D).filter(isValidPoint);
};

/**
 * Transforms the provided point
 * cloud with the supplied matrix.
 * @param positions Positions of the points
 * in the point cloud.
 * @param matrix The matrix transform.
 * @returns The transformed points
 */
const transformPointCloud = (
  positions: FlatMat<number>,
  matrix: THREE.Matrix4,
) => {
  /**
   * ThreeJS uses column-major ordering
   * Source: https://threejs.org/docs/index.html?q=matrix#api/en/math/Matrix4
   */
  const transformedPoints = [];
  // Multiply the local points by the matrixWorld to obtain the transformed points
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Apply the matrix transformation directly to the coordinates
    const transformedX =
      matrix.elements[0] * x +
      matrix.elements[4] * y +
      matrix.elements[8] * z +
      matrix.elements[12];
    const transformedY =
      matrix.elements[1] * x +
      matrix.elements[5] * y +
      matrix.elements[9] * z +
      matrix.elements[13];
    const transformedZ =
      matrix.elements[2] * x +
      matrix.elements[6] * y +
      matrix.elements[10] * z +
      matrix.elements[14];

    // Push the transformed coordinates to the array
    transformedPoints.push(transformedX, transformedY, transformedZ);
  }

  // Extract the transformed points as a regular JavaScript array
  return transformedPoints;
};

export { parsePCDFile, transformPointCloud };
