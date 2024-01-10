export function eulerMatrix(x: number, y: number, z: number): Matrix {
    let sa = Math.sin(x);
    let ca = Math.cos(x);
    let sb = Math.sin(z);
    let cb = Math.cos(z);
    let sh = Math.sin(y);
    let ch = Math.cos(y);

    return [
        [ch * ca, sa, -sh * ca, 0],
        [((-ch) * sa * cb) + (sh * sb), ca * cb, (sh * sa * cb) + (ch * sb), 0],
        [(ch * sa * sb) + (sh * cb), (-ca) * sb, (-sh * sa * sb) + (ch * cb), 0],
        [0, 0, 0, 1],
    ];
}

export function arrayToMatrix(a: number[], rowsColumns: number): number[][] {
    let ret = [];
    let i = 0;
    for (let row = 0; row < rowsColumns; row++) {
        let newRow = [];

        for (let column = 0; column < rowsColumns; column++) {
            newRow.push(a[i]);
            i++;
        }

        ret.push(newRow);
    }

    return ret;
}

export type Matrix = number[][];

export function multiplyMatrices(a: Matrix, b: Matrix) {
    let aNumRows = a.length;
    let aNumCols = a[0].length;

    let bNumRows = b.length;
    let bNumCols = b[0].length;

    let m: number[][] = new Array(aNumRows);  // initialize array of rows

    for (let r = 0; r < aNumRows; ++r) {
        m[r] = new Array(bNumCols); // initialize the current row
        for (let c = 0; c < bNumCols; ++c) {
            m[r][c] = 0; // initialize the current cell
            for (let i = 0; i < aNumCols; ++i) {
                m[r][c] += a[r][i] * b[i][c];
            }
        }
    }

    return m;
}

export function multiplyManyMatrices(...matrices: Matrix[]): Matrix {
    let matrix = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];

    for (let m of matrices) {
        matrix = multiplyMatrices(m, matrix);
    }

    return matrix;
}

export function translationMatrix(x: number, y: number, z: number): Matrix {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [x, y, z, 1],
    ];
}

export function scaleMatrix(x: number, y: number, z: number): Matrix {
    return [
        [x, 0, 0, 0],
        [0, y, 0, 0],
        [0, 0, z, 0],
        [0, 0, 0, 1],
    ];
}