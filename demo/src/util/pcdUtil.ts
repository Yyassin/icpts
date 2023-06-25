/**
 * Helper functions for dealing with .pcd files
 */

const lineToPoint3D = (line: string) => line.split(" ").map((x) => 25 * Number(x));
const isValidPoint = (point: number[]) => point.length === 3;

/**
 * Parses the specified pcd file
 * and returns an array of the contained points.
 * @param filename Path to the PCD file to parse (relative to /public).
 */
const parsePCDFile = async (filepath: string) => {
    const file = await fetch(filepath).then((response) => response.text());
    const lines = file.split("\n").map((line) => line.trim());

    // Iterate until we get past the metadata and to the
    // points (usually line 11, but we'll be more robust).
    let pointsStartIndex = 0;
    while (!lines[pointsStartIndex++].startsWith("DATA"));
    // The points start on the next line after DATA.
    pointsStartIndex++;

    // Extract each valid euclidean point (3D)
    return lines.slice(pointsStartIndex).map(lineToPoint3D).filter(isValidPoint);
};

export { parsePCDFile };
