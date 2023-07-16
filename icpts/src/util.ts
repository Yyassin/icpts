/**
 * General utility functions
 * (because I don't need all of lodash :))
 * @author Yousef Yassin
 */

import { FlatMat } from "./types";

/**
 * Creates chunks of size n with the elements
 * in the provided array. Returns the resulting
 * array of chunks.
 * @param array The array to chunk.
 * @param n The chunk size.
 * @returns The array of chunks.
 */
const chunkArray = <T>(array: FlatMat<T>, n: number) => {
    const length = array.length;
    const result = new Array<FlatMat<T>>(Math.ceil(length / n));

    let index = 0;
    let chunkIndex = 0;

    while (index < length) {
        result[chunkIndex++] = array.slice(index, index + n);
        index += n;
    }

    return result;
};

export { chunkArray };
