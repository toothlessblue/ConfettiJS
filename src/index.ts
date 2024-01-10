import {resizeCanvasToDisplaySize, spawnCanvas} from './CanvasHelper';
import {createShader, createShaderProgram, linkShaderProgram} from './ShaderHelper';
import {simple_frag, simple_vert} from './shaders/ShaderSimple';
import {degToRad, repeat} from './utils';
import {eulerMatrix, Matrix, multiplyManyMatrices, scaleMatrix, translationMatrix} from './MatrixHelper';
import {particlePhysics_frag, particlePhysics_vert} from './shaders/ParticlePhysics';

export class Confetti {
    instancesAcross = 100;
    instances = this.instancesAcross * this.instancesAcross;

    confettiVertices = [
        -1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,

        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
    ];

    gl: WebGL2RenderingContext;

    confettiVertexBuffer!: WebGLBuffer;
    dataBuffer!: WebGLBuffer;
    updateBuffer!: WebGLBuffer;

    viewMatrix!: Matrix;

    renderVAO: WebGLVertexArrayObject;
    computeVAO: WebGLVertexArrayObject;

    renderProgram!: WebGLProgram;
    computeProgram!: WebGLProgram;

    viewMatrixUniformLocation!: WebGLUniformLocation;

    constructor() {
        this.gl = spawnCanvas();

        this.gl.clearColor(0, 0, 0, 0);

        this.setupRenderShader();
        this.setupComputeShader();

        this.renderVAO = this.createDefiniteVao();
        this.computeVAO = this.createDefiniteVao();

        this.updateViewport();
        this.initialiseVertexBuffer();
        this.initialiseDataBuffers();
        this.updateViewMatrix();

        this.setupRenderVAO();
        this.setupComputeVAO();
    }

    private createDefiniteBuffer(): WebGLBuffer {
        let buffer = this.gl.createBuffer();

        if (!buffer) {
            throw new Error('Failed to create buffer!');
        }

        return buffer;
    }

    private createDefiniteVao(): WebGLVertexArrayObject {
        let vao = this.gl.createVertexArray();

        if (!vao) {
            throw new Error('Failed to create buffer!');
        }

        return vao;
    }

    private getDefiniteUniformLocation(program: WebGLProgram, uniformName: string): WebGLUniformLocation {
        let location = this.gl.getUniformLocation(program, uniformName);

        if (!location) {
            throw new Error(`Failed to get uniform location! "${uniformName}"`);
        }

        return location;
    }

    private setupRenderVAO() {
        this.renderVAO = this.createDefiniteVao();

        this.gl.bindVertexArray(this.renderVAO);

        this.gl.enableVertexAttribArray(0);
        this.gl.enableVertexAttribArray(1);
        this.gl.enableVertexAttribArray(2);
        this.gl.enableVertexAttribArray(3);
        this.gl.enableVertexAttribArray(4);

        this.gl.vertexAttribDivisor(1, 1);
        this.gl.vertexAttribDivisor(2, 1);
        this.gl.vertexAttribDivisor(3, 1);
        this.gl.vertexAttribDivisor(4, 1);
    }

    private setupComputeVAO() {
        this.computeVAO = this.createDefiniteVao();

        this.gl.bindVertexArray(this.computeVAO);

        this.gl.enableVertexAttribArray(0);
        this.gl.enableVertexAttribArray(1);
        this.gl.enableVertexAttribArray(2);
        this.gl.enableVertexAttribArray(3);
        this.gl.enableVertexAttribArray(4);
        this.gl.enableVertexAttribArray(5);
        this.gl.enableVertexAttribArray(6);
        this.gl.enableVertexAttribArray(7);

        this.gl.vertexAttribDivisor(0, 1);
        this.gl.vertexAttribDivisor(1, 1);
        this.gl.vertexAttribDivisor(2, 1);
        this.gl.vertexAttribDivisor(3, 1);
        this.gl.vertexAttribDivisor(4, 1);
        this.gl.vertexAttribDivisor(5, 1);
        this.gl.vertexAttribDivisor(6, 1);
        this.gl.vertexAttribDivisor(7, 1);
    }

    private updateViewport() {
        resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }

    private updateViewMatrix() {
        this.viewMatrix = multiplyManyMatrices(
            scaleMatrix(2 / this.gl.canvas.width, 2 / this.gl.canvas.height, 0),
            translationMatrix(-this.gl.canvas.width / 2, -this.gl.canvas.height / 2, 0),
        );

        this.gl.useProgram(this.renderProgram);
        this.gl.uniformMatrix4fv(this.viewMatrixUniformLocation, false, this.viewMatrix.flat());
    }

    private initialiseVertexBuffer() {
        this.confettiVertexBuffer = this.createDefiniteBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.confettiVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.confettiVertices), this.gl.STATIC_DRAW);
    }

    private initialiseDataBuffers() {
        let xRads = 0;
        let yRads = degToRad(50);
        let zRads = degToRad(50);

        let scale: number[][] = [
            [10, 0, 0, 0],
            [0, 10, 0, 0],
            [0, 0, 10, 0],
            [0, 0, 0, 1],
        ];

        let initData = repeat(i => {
            return [
                // translation matrix
                multiplyManyMatrices(
                    translationMatrix(
                        1500 * (i % this.instancesAcross) / this.instancesAcross,
                        this.gl.canvas.height * Math.floor(i / this.instancesAcross) / this.instancesAcross,
                        0,
                    ),
                    eulerMatrix(xRads, yRads, zRads),
                    scale,
                ),
                // velocity matrix
                translationMatrix(0, 0, 0),
            ];
        }, this.instances).flat(3);

        this.dataBuffer = this.createDefiniteBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dataBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(initData), this.gl.DYNAMIC_DRAW);

        this.updateBuffer = this.createDefiniteBuffer();
    }

    private setupRenderShader() {
        let vertShader = createShader(this.gl, this.gl.VERTEX_SHADER, simple_vert);
        let fragShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, simple_frag);
        let program = createShaderProgram(this.gl, vertShader, fragShader);

        linkShaderProgram(this.gl, program);

        this.renderProgram = program;

        this.viewMatrixUniformLocation = this.getDefiniteUniformLocation(this.renderProgram, 'viewMatrix');
    }

    private setupComputeShader() {
        let vert = createShader(this.gl, this.gl.VERTEX_SHADER, particlePhysics_vert);
        let frag = createShader(this.gl, this.gl.FRAGMENT_SHADER, particlePhysics_frag);

        let program = createShaderProgram(this.gl, vert, frag);

        this.gl.transformFeedbackVaryings(
            program,
            ['out_translation', 'out_velocity'],
            this.gl.INTERLEAVED_ATTRIBS,
        );

        linkShaderProgram(this.gl, program);

        this.computeProgram = program;
    }

    render() {
        this.gl.bindVertexArray(this.renderVAO);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.confettiVertexBuffer);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dataBuffer);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 128, 0);
        this.gl.vertexAttribPointer(2, 4, this.gl.FLOAT, false, 128, 16);
        this.gl.vertexAttribPointer(3, 4, this.gl.FLOAT, false, 128, 32);
        this.gl.vertexAttribPointer(4, 4, this.gl.FLOAT, false, 128, 48);

        this.gl.useProgram(this.renderProgram);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.updateViewport();
        this.updateViewMatrix();

        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, this.instances);
    }

    compute() {
        this.gl.bindVertexArray(this.computeVAO);
        this.gl.useProgram(this.computeProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dataBuffer);

        // Translation binding
        this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 128, 0);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 128, 16);
        this.gl.vertexAttribPointer(2, 4, this.gl.FLOAT, false, 128, 32);
        this.gl.vertexAttribPointer(3, 4, this.gl.FLOAT, false, 128, 48);
        // Velocity binding
        this.gl.vertexAttribPointer(4, 4, this.gl.FLOAT, false, 128, 64);
        this.gl.vertexAttribPointer(5, 4, this.gl.FLOAT, false, 128, 80);
        this.gl.vertexAttribPointer(6, 4, this.gl.FLOAT, false, 128, 96);
        this.gl.vertexAttribPointer(7, 4, this.gl.FLOAT, false, 128, 112);

        let transformFeedback = this.gl.createTransformFeedback();
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, transformFeedback);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.updateBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, 128 * this.instances, this.gl.DYNAMIC_DRAW);
        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.updateBuffer);

        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.TRANSFORM_FEEDBACK_BUFFER, null);

        this.gl.enable(this.gl.RASTERIZER_DISCARD);
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, transformFeedback);
        this.gl.beginTransformFeedback(this.gl.POINTS);
        this.gl.drawArraysInstanced(this.gl.POINTS, 0, 1, this.instances);
        this.gl.endTransformFeedback();
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
        this.gl.disable(this.gl.RASTERIZER_DISCARD);

        let oldData = this.dataBuffer;

        this.dataBuffer = this.updateBuffer;
        this.updateBuffer = oldData;
    }

    loop() {
        this.compute();
        this.render();

        requestAnimationFrame(() => {
            this.loop();
        });
    }
}

let confetti = new Confetti();
confetti.loop();