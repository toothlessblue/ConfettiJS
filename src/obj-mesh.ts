import { Mesh, MeshDataType } from "./mesh";

export class OBJMesh extends Mesh {
    constructor(meshSource: string) {
        super();

        console.log('TO DO', meshSource);
    }

    override getMeshData(dataLayout: MeshDataType[]): Float32Array {
        return new Float32Array();
    }

    override getVertexCount(): number {
        return 0;
    } 
}
