import { Mesh, MeshDataType } from "./mesh";

/**
 * Represents a mesh loaded from an OBJ source.
 */
export class OBJMesh extends Mesh {
    /**
     * Creates a new OBJMesh instance.
     * @param meshSource - The source string of the OBJ mesh.
     */
    constructor(meshSource: string) {
        super();

        console.log('TO DO', meshSource);
    }

    /**
     * Retrieves the mesh data for the given data layout.
     * @param dataLayout - The layout of the mesh data.
     * @returns A Float32Array containing the mesh data.
     */
    override getMeshData(dataLayout: MeshDataType[]): Float32Array {
        return new Float32Array();
    }

    override getVertexCount(): number {
        return 0;
    } 
}
