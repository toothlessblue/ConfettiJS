import { AttributeArrayType, getAttributeTypeSize } from './attribute-array-data';
import { MeshDataType } from './mesh';

export interface AttributeData {
    name: string,
    type: AttributeArrayType
}

interface AttributeLocation extends AttributeData {
    location: number;
}

export type BufferLayout = AttributeLocation[];

export interface DataLayout {
    mesh: BufferLayout;
    particle: BufferLayout;
}

// Returns the number of 32 bit integers per attribute of the specified buffer
export function getBufferStride(buffer: AttributeData[]) {
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

export function getAttributeOffsetBytes(name: string, layout: AttributeData[]) {
    let offset = 0;

    for (let attribute of layout) {
        if (attribute.name === name) {
            return offset * 4;
        }

        offset += getAttributeTypeSize(attribute.type);
    }

    throw new Error(`Couldn't find attribute ${name} in layout ${JSON.stringify(layout)}`);
}
