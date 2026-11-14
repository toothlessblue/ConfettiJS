/**
 * Converts a WebGL error code into a human-readable string.
 * @param error - The WebGL error code.
 * @returns A string representation of the error.
 */
export function convertGLErrorToString(error: number) {
    switch (error) {
        case WebGL2RenderingContext.NO_ERROR:
            return 'NO_ERROR';
        case WebGL2RenderingContext.INVALID_ENUM:
            return 'INVALID_ENUM';
        case WebGL2RenderingContext.INVALID_VALUE:
            return 'INVALID_VALUE';
        case WebGL2RenderingContext.INVALID_OPERATION:
            return 'INVALID_OPERATION';
        case WebGL2RenderingContext.INVALID_FRAMEBUFFER_OPERATION:
            return 'INVALID_FRAMEBUFFER_OPERATION';
        case WebGL2RenderingContext.OUT_OF_MEMORY:
            return 'OUT_OF_MEMORY';
        case WebGL2RenderingContext.CONTEXT_LOST_WEBGL:
            return 'CONTEXT_LOST_WEBGL';
        default:
            return 'UNKNOWN ERROR!';
    }
}

/**
 * Checks if a number is a power of two.
 * @param value - The number to check.
 * @returns True if the value is a power of two, false otherwise.
 */
export function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0;
}

/**
 * Returns a new array containing only unique elements from the input array,
 * based on a key provided by the `toKey` function.
 * @param ofItems - The array of items to filter.
 * @param toKey - A function that returns a unique key for each item.
 * @returns A new array with unique items.
 */
export function uniqueOf<T>(ofItems: T[], toKey: (v: T) => string) {
    let ret: T[] = [];
    let got = new Set<string>();

    for (let v of ofItems) {
        let k = toKey(v);
        if (got.has(k)) continue;
        got.add(k);
        ret.push(v);
    }

    return ret;
}

export const COMPUTE_FRAG_SOURCE = `#version 300 es
precision highp float;

void main() {
}
`;
