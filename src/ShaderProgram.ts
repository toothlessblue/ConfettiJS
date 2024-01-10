import {createShader, createShaderProgram, linkShaderProgram} from './ShaderHelper';

export class ShaderProgram {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;

    private uniformCache: Record<string, WebGLUniformLocation> = {};

    constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string, varyings?: string[]) {
        this.gl = gl;

        let vertShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexSource);
        let fragShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentSource);
        this.program = createShaderProgram(this.gl, vertShader, fragShader);

        if (varyings) {
            this.gl.transformFeedbackVaryings(this.program, varyings, this.gl.INTERLEAVED_ATTRIBS);
        }

        linkShaderProgram(this.gl, this.program);
    }

    private getDefiniteLocation(uniformName: string) {
        let location = this.gl.getUniformLocation(this.program, uniformName);

        if (!location) {
            throw new Error(`Unable to get uniform "${uniformName}" location`);
        }

        return location;
    }

    getLocation(uniformName: string) {
        if (!this.uniformCache[uniformName]) {
            this.uniformCache[uniformName] = this.getDefiniteLocation(uniformName);
        }

        return this.uniformCache[uniformName];
    }

    use() {
        this.gl.useProgram(this.program);
    }

    uniform1fv(uniformName: string, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform1iv(location, data, srcOffset, srcLength);
    }

    uniform1iv(uniformName: string, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform1iv(location, data, srcOffset, srcLength);
    }

    uniform2fv(uniformName: string, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform2fv(location, data, srcOffset, srcLength);
    }

    uniform2iv(uniformName: string, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform2iv(location, data, srcOffset, srcLength);
    }

    uniform3fv(uniformName: string, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform3fv(location, data, srcOffset, srcLength);
    }

    uniform3iv(uniformName: string, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform3iv(location, data, srcOffset, srcLength);
    }

    uniform4fv(uniformName: string, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform4fv(location, data, srcOffset, srcLength);
    }

    uniform4iv(uniformName: string, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniform4iv(location, data, srcOffset, srcLength);
    }

    uniformMatrix2fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix2fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix3fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix3fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix4fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix4fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix2x3fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix2x3fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix2x4fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix2x4fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix3x2fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix3x2fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix3x4fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix3x4fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix4x2fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix4x2fv(location, transpose, data, srcOffset, srcLength);
    }

    uniformMatrix4x3fv(uniformName: string, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): void {
        this.use();
        let location = this.getLocation(uniformName);
        this.gl.uniformMatrix4x3fv(location, transpose, data, srcOffset, srcLength);
    }

}