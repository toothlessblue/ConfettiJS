export function repeat<T>(callback: (index: number) => T, times: number): T[] {
    let out: T[] = [];

    for (let i = 0; i < times; i++) {
        out.push(callback(i));
    }

    return out;
}

export function degToRad(deg: number) {
    return deg * (Math.PI / 180);
}

export function radToDeg(rad: number) {
    return rad * (180 / Math.PI);
}