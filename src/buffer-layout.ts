import { AttributeArrayType, getAttributeTypeSize } from "./attribute-array-data";
import { MeshDataType } from "./mesh";

interface Common {
    layout: AttributeArrayType[],
    types?: GLuint[], // GL type, assumed to be gl.FLOAT if undefined

    // normalised defaults to false, I don't know what it's for or why it's useful, make your case for it in github issues I guess
}

export interface MeshBufferLayout extends Common {
    meshLayout: MeshDataType[], // Controls how to map mesh data onto this buffer layout
}

export interface ParticleBufferLayout extends Common {
}

export type BufferLayout = MeshBufferLayout | ParticleBufferLayout;

export type ShaderLayout = [MeshBufferLayout, ParticleBufferLayout];

// Returns the number of 32 bit integers per attribute of the specified buffer
export function getBufferStride(buffer: BufferLayout) {
    let sum = 0;
    for (let type of buffer.layout) {
        sum += getAttributeTypeSize(type);
    }
    return sum;
}
