export const GLSL_SIZE_FLOAT = 4;
export const GLSL_SIZE_VEC2 = 8;
export const GLSL_SIZE_VEC3 = 12;
export const GLSL_SIZE_VEC4 = 16;
export const GLSL_SIZE_MAT4 = 64;

export class ShaderBuffer {
    buffer: WebGLBuffer;
    gl: WebGL2RenderingContext;
    bufferStride: number;
    structure: number[];

    constructor(gl: WebGL2RenderingContext, structure: number[]) {
        for (let i = 0; i < structure.length; i++) {
            let divided: number[] = [];
            while (structure[i] > 16) {
                divided.push(16);
                structure[i] -= 16;
            }
            divided.push(structure[i]);
            structure.splice(i, 1, ...divided);
        }

        console.log(`structure:`, structure);

        this.gl = gl;
        this.buffer = this.createDefiniteBuffer();
        this.structure = structure;
        this.bufferStride = this.structure.reduce((a, b) => a + b);
    }

    private createDefiniteBuffer(): WebGLBuffer {
        let buffer = this.gl.createBuffer();

        if (!buffer) {
            throw new Error('Failed to create buffer!');
        }

        return buffer;
    }

    bind(target: number) {
        this.gl.bindBuffer(target, this.buffer);
    }

    setupVertexAttribPointers(locations: number[], target = this.gl.ARRAY_BUFFER) {
        if (locations.length > this.structure.length) {
            throw new Error(`Provided too many locations, needed <= ${this.structure.length}, got ${locations.length}`);
        }

        this.bind(target);

        let attribute = 0;
        let offset = 0;

        for (let i = 0; i < locations.length; i++) {
            this.gl.enableVertexAttribArray(attribute);
            this.gl.vertexAttribPointer(locations[i], this.structure[i] / 4, this.gl.FLOAT, false, this.bufferStride, offset);

            attribute++;
            offset += this.structure[i];
        }
    }
}

