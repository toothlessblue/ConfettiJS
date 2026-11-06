export enum MeshDataType {
    POSITION,
    UV,
    NORMAL,
}

export abstract class Mesh {
    abstract getVertexCount(): number;
    abstract getMeshData(dataLayout: MeshDataType[]): Float32Array;
}
