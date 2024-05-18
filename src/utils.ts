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

export function randomRange(min: number, max: number): number {
    return (Math.random() * (max - min)) + min;
}

export function randomInt(min: number, max: number): number {
    return Math.floor(randomRange(min, max));
}

export function randomFromArray<T>(array: T[]): T {
    return array[randomInt(0, array.length)];
}

export function firstWord(string: string) {
    return string.substring(0, string.indexOf(' '));
}