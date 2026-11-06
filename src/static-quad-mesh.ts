import { Mesh, MeshDataType } from './mesh';

export class StaticQuadMesh extends Mesh {
    private static VERTICES = [
        [-1.0, -1.0, 0.0],
        [-1.0, 1.0, 0.0],
        [1.0, -1.0, 0.0],

        [1.0, -1.0, 0.0],
        [-1.0, 1.0, 0.0],
        [1.0, 1.0, 0.0],
    ];

    private static UV = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 0],
        [0, 1],
        [1, 1],
    ];

    private static NORMAL = [
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
    ];

    override getVertexCount(): number {
        return StaticQuadMesh.VERTICES.length;
    }

    override getMeshData(dataLayout: MeshDataType[]): Float32Array {
        let data: number[] = [];

        for (let v = 0; v < this.getVertexCount(); v++) {
            for (let type of dataLayout) {
                switch (type) {
                    case MeshDataType.POSITION:
                        data.push(...StaticQuadMesh.VERTICES[v]);
                        break;
                    case MeshDataType.UV:
                        data.push(...StaticQuadMesh.UV[v]);
                        break;
                    case MeshDataType.NORMAL:
                        data.push(...StaticQuadMesh.NORMAL[v]);
                        break;
                    default:
                        throw new Error(`StaticQuadMesh does not provide MeshDataType ${type}`);
                }
            }
        }

        return new Float32Array(data);
    }
}
