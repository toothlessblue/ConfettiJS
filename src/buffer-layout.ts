import { AttributeArrayType, getAttributeTypeSize } from './attribute-array-data';
import { MeshDataType } from './mesh';

export type BufferLayout = {
    type: AttributeArrayType;
    location: number;
    name: string;
}[];

export interface DataLayout {
    mesh: BufferLayout;
    lifetime: BufferLayout;
    particle: BufferLayout;
}

// Returns the number of 32 bit integers per attribute of the specified buffer
export function getBufferStride(buffer: BufferLayout) {
    let sum = 0;
    for (let attribute of buffer) {
        sum += getAttributeTypeSize(attribute.type);
    }
    return sum;
}

export function bufferLayoutToMeshData(layout: BufferLayout) {
    let attributeNameToMeshDataType: Record<string, MeshDataType> = {
        'modelPosition': MeshDataType.POSITION,
        'modelNormal': MeshDataType.NORMAL,
        'modelUv': MeshDataType.UV,
    }

    let ret: MeshDataType[] = [];

    for (let attribute of layout) {
        if (attributeNameToMeshDataType[attribute.name] !== undefined) {
            ret.push(attributeNameToMeshDataType[attribute.name]);
        }
    }

    return ret;
}
