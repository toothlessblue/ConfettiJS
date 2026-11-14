/**
 * Data types for mesh attributes.
 */
export enum MeshDataType {
    /** Vertex position data. */
    POSITION,
    /** Texture coordinate data. */
    UV,
    /** Vertex normal data. */
    NORMAL,
}

/**
 * Base class representing a 3D mesh.
 * @abstract
 */
export abstract class Mesh {
    /**
     * Gets the number of vertices in the mesh.
     * @returns The vertex count.
     */
    abstract getVertexCount(): number;
    /**
     * Retrieves the mesh data for the specified data layouts.
     * @param dataLayout - An array of {@link MeshDataType} specifying the order of data to retrieve.
     * @returns A `Float32Array` containing the requested mesh data.
     */
    abstract getMeshData(dataLayout: MeshDataType[]): Float32Array;
}
