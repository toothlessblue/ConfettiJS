import { convertGLErrorToString } from "./utils";

export class Webgl2ContextHelper {
    readonly context: WebGL2RenderingContext;

    constructor(context: WebGL2RenderingContext) {
        this.context = context;
    }

    /**
     * Creates a new Vertex Array Object (VAO).
     * @returns The created VAO.
     * @throws Error if the VAO cannot be created.
     */
    createVAO() {
        let vao = this.context.createVertexArray();
        if (!vao) {
            throw new Error('Unable to create vertex array!');
        }
        return vao;
    }

    /**
     * Creates a new Vertex Buffer Object (VBO).
     * @returns The created VBO.
     * @throws Error if the VBO cannot be created.
     */
    createVBO() {
        let vbo = this.context.createBuffer();
        if (!vbo) {
            throw new Error('Unable to create vertex buffer!');
        }
        return vbo;
    }

    /**
     * Checks for and throws an error if the shader failed to compile.
     * @param shader - The WebGL shader to check.
     */
    private checkShaderErrors(shader: WebGLShader) {
        let log = this.context.getShaderInfoLog(shader);
        if (log === null || log === '') return;

        throw new Error('Shader compilation error! ' + log);
    }

    /**
     * Checks for and throws an error if the program failed to link.
     * @param program - The WebGL program to check.
     */
    private checkLinkingErrors(program: WebGLProgram) {
        let log = this.context.getProgramInfoLog(program);
        if (log === null || log === '') return;

        throw new Error('Program linking error! ' + log);
    }

    /**
     * Builds a WebGL program from vertex and fragment shader source strings.
     * @param shaderVert - The vertex shader source.
     * @param shaderFrag - The fragment shader source.
     * @param varyings - Optional array of varyings for transform feedback.
     * @returns The compiled and linked WebGL program.
     */
    buildShaderProgram(shaderVert: string, shaderFrag: string, varyings?: string[]): WebGLProgram {
        let program = this.context.createProgram();

        let vert = this.context.createShader(this.context.VERTEX_SHADER);
        if (!vert) throw new Error('Failed to create vertex shader!');

        let frag = this.context.createShader(this.context.FRAGMENT_SHADER);
        if (!frag) throw new Error('Failed to create fragment shader!');

        this.context.shaderSource(vert, shaderVert);
        this.context.compileShader(vert);
        this.checkShaderErrors(vert);

        this.context.shaderSource(frag, shaderFrag);
        this.context.compileShader(frag);
        this.checkShaderErrors(frag);

        this.context.attachShader(program, vert);
        this.context.attachShader(program, frag);

        if (varyings) {
            this.context.transformFeedbackVaryings(program, varyings, WebGL2RenderingContext.INTERLEAVED_ATTRIBS);
        }

        this.context.linkProgram(program);
        this.checkLinkingErrors(program);

        return program;
    }

    /**
     * Checks for and logs any WebGL errors.
     */
    checkWebglError() {
        let error = this.context.getError();
        if (error == this.context.NO_ERROR) return;

        console.error(convertGLErrorToString(error));
    }
}
