/**
 * General utility functions
 * (because I don't want to pull lodash :))
 */

import { FlatArray } from "./types";

/**
 * Creates chunks of size n with the elements
 * in the provided array. Returns the resulting
 * array of chunks.
 * @param array The array to chunk.
 * @param n The chunk size.
 * @returns The array of chunks.
 */
const chunkArray = <T>(array: FlatArray<T>, n: number) => {
    const length = array.length;
    const result = new Array<FlatArray<T>>(Math.ceil(length / n));

    let index = 0;
    let chunkIndex = 0;

    while (index < length) {
        result[chunkIndex++] = array.slice(index, index + n);
        index += n;
    }

    return result;
};

export { chunkArray };
