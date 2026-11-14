import { AttributeArrayType, getAttributeTypeSize } from './attribute-array-data';
import { MeshDataType } from './mesh';

/**
 * Represents data for a single attribute in a buffer.
 */
export interface AttributeData {
    /** The name of the attribute. */
    name: string,
    /** The type of the attribute array. */
    type: AttributeArrayType
}

interface AttributeLocation extends AttributeData {
    location: number;
}

/**
 * An array of attribute locations, defining the layout of a buffer.
 */
export type BufferLayout = AttributeLocation[];

/**
 * A mapping of buffer layouts for both mesh and particle data.
 */
export interface DataLayout {
    /** Buffer layout for mesh data. */
    mesh: BufferLayout;
    /** Buffer layout for particle data. */
    particle: BufferLayout;
}

// Returns the number of 32 bit integers per attribute of the specified buffer
/**
 * Calculates the total stride for a buffer, measured in 32-bit integers.
 * @param buffer - The array of attributes in the buffer.
 * @returns The total stride.
 */
export function getBufferStride(buffer: AttributeData[]) {
    let sum = 0;
    for (let attribute of buffer) {
        sum += getAttributeTypeSize(attribute.type);
    }
    return sum;
}

/**
 * Converts a buffer layout into a list of `MeshDataType`s.
 * @param layout - The buffer layout to convert.
 * @returns An array of mesh data types.
 */
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

/**
 * Calculates the byte offset for a specific attribute in a given layout.
 * @param name - The name of the attribute to find.
 * @param layout - The layout to search in.
 * @returns The byte offset of the attribute.
 * @throws Error if the attribute is not found in the layout.
 */
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

