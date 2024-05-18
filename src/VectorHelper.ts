import {degToRad, randomRange} from './utils';

export function normalise(x: number, y: number, z: number): [number, number, number] {
    let total = x + y + z;

    return [x / total, y / total, z / total];
}

export function randomDirection2d(startDeg: number = 0, endDeg: number = 360): [number, number] {
    let startRad = degToRad(startDeg);
    let endRad = degToRad(endDeg);

    let theta = randomRange(startRad, endRad);
    return [Math.sin(theta), Math.cos(theta)];
}