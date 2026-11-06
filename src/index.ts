import { attributeArrayTypeToString, getAttributeTypeSize } from './attribute-array-data';
import { getBufferStride, MeshBufferLayout, ParticleBufferLayout } from './buffer-layout';
import { ConfettiGeneratorFunction } from './confetti-generator-function';
import { Matrix, multiplyManyMatrices, scaleMatrix, translationMatrix } from './matrix-helper';
import { defaultOptions, InitOptions, Options } from './options';
import { convertGLErrorToString } from './utils';

console.log('Hello world!');

export class ConfettiEngine {
    private context: WebGL2RenderingContext;
    private shaderProgram: WebGLProgram;
    private vertexArray: WebGLVertexArrayObject;
    private rafId: any = null;
    private options: Options;
    private instanceCount: number = 0;
    private meshBuffer: WebGLBuffer;
    private particleBuffer: WebGLBuffer;
    private viewMatrix: Matrix;

    private createCanvasAndAddToDOM(parent: HTMLElement): HTMLCanvasElement {
        let canvas = document.createElement('canvas');
        parent.appendChild(canvas);
        return canvas;
    }

    private getContextOrFail(canvas: HTMLCanvasElement) {
        let context = canvas.getContext('webgl2');
        if (!context) {
            throw new Error(`Unable to get webgl2 canvas context! Is the browser up to date? Is webgl enabled?`);
        }
        return context;
    }

    private readAndPrintError() {
        let error = this.context.getError();
        if (error == this.context.NO_ERROR) return;

        console.error(convertGLErrorToString(error));
    }

    private readAndThrowShaderCompilationErrors(shader: WebGLShader) {
        let log = this.context.getShaderInfoLog(shader);
        if (log === null || log === '') return;

        throw new Error('Shader compilation error! ' + log);
    }

    private readAndThrowProgramLinkingErrors(program: WebGLProgram) {
        let log = this.context.getProgramInfoLog(program);
        if (log === null || log === '') return;

        throw new Error('Program linking error! ' + log);
    }

    private createVAO() {
        let vao = this.context.createVertexArray();
        if (!vao) {
            throw new Error('Unable to create vertex array!');
        }
        return vao;
    }

    private createVBO() {
        let vbo = this.context.createBuffer();
        if (!vbo) {
            throw new Error('Unable to create vertex buffer!');
        }
        return vbo;
    }

    private buildShaderProgram(shaderVert: string, shaderFrag: string): WebGLProgram {
        let program = this.context.createProgram();

        let vert = this.context.createShader(this.context.VERTEX_SHADER);
        if (!vert) throw new Error('Failed to create vertex shader!');

        let frag = this.context.createShader(this.context.FRAGMENT_SHADER);
        if (!frag) throw new Error('Failed to create fragment shader!');

        console.log('Compiling confetti vertex shader');
        this.context.shaderSource(vert, shaderVert);
        this.context.compileShader(vert);
        this.readAndThrowShaderCompilationErrors(vert);

        console.log('Compiling confetti fragment shader');
        this.context.shaderSource(frag, shaderFrag);
        this.context.compileShader(frag);
        this.readAndThrowShaderCompilationErrors(frag);

        this.context.attachShader(program, vert);
        this.context.attachShader(program, frag);

        this.context.linkProgram(program);
        this.readAndThrowProgramLinkingErrors(program);

        return program;
    }

    private renderCompute() {
        this.context.useProgram(this.shaderProgram);

        this.context.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

        this.context.drawArraysInstanced(
            WebGL2RenderingContext.TRIANGLES,
            0,
            this.options.mesh.getVertexCount(),
            this.instanceCount
        );
        this.readAndPrintError();

        this.context.flush();
    }

    private renderComputeLoop() {
        this.renderCompute();
        requestAnimationFrame(this.renderComputeLoop.bind(this));
    }

    private setUpMeshBuffer(vbo: WebGLBuffer) {
        let buffer = this.options.bufferLayout[0];

        console.log(this.options.mesh.getMeshData(buffer.meshLayout));

        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        this.context.bufferData(
            WebGL2RenderingContext.ARRAY_BUFFER,
            this.options.mesh.getMeshData(buffer.meshLayout),
            WebGL2RenderingContext.STATIC_DRAW
        );

        this.applyBufferAttributes(buffer, 0, 0);
    }

    private setUpParticleBuffer(vbo: WebGLBuffer) {
        let buffer = this.options.bufferLayout[1];
        let attributeIndex = this.options.bufferLayout[0].layout.length;

        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        this.applyBufferAttributes(buffer, attributeIndex, 1);
    }

    private applyBufferAttributes(
        buffer: MeshBufferLayout | ParticleBufferLayout,
        attributeIndex: number,
        divisor: number
    ) {
        let stride = getBufferStride(buffer);
        let offset = 0;

        for (let attributeI in buffer.layout) {

            this.context.enableVertexAttribArray(attributeIndex);
            this.context.vertexAttribDivisor(attributeIndex, divisor);

            this.context.vertexAttribPointer(
                attributeIndex,
                getAttributeTypeSize(buffer.layout[attributeI]),
                buffer.types?.[attributeI] ?? WebGL2RenderingContext.FLOAT,
                false,
                stride * 4,
                offset
            );

            console.debug('vertexAttribPointer call', attributeIndex, getAttributeTypeSize(buffer.layout[attributeI]), 'FLOAT', false, stride * 4, offset);

            offset += getAttributeTypeSize(buffer.layout[attributeI]) * 4; // * 4 for 32bit, i.e. 4 bytes per float/int
            attributeIndex++;
        }
    }

    private updateViewMatrix() {
        this.viewMatrix = multiplyManyMatrices(
            scaleMatrix(2 / this.context.canvas.width, 2 / this.context.canvas.height, 1.0),
            translationMatrix(-this.context.canvas.width / 2, -this.context.canvas.height / 2, 0),
        );

        this.context.useProgram(this.shaderProgram);

        this.context.uniformMatrix4fv(
            this.context.getUniformLocation(this.shaderProgram, 'viewMatrix'),
            false,
            this.viewMatrix.flat()
        );
        return this.viewMatrix;
    }

    constructor(options: InitOptions) {
        // parentElement cannot be part of defaultOptions (it won't be available at the time of the script being loaded)
        this.options = { parentElement: document.body, ...defaultOptions, ...options };

        let parent = this.options.parentElement;
        let canvas = this.options.canvas ?? this.createCanvasAndAddToDOM(parent);

        this.context = this.getContextOrFail(canvas);
        this.vertexArray = this.createVAO();
        this.context.bindVertexArray(this.vertexArray);
        this.shaderProgram = this.buildShaderProgram(this.options.shaderVert, this.options.shaderFrag);

        this.meshBuffer = this.createVBO();
        this.particleBuffer = this.createVBO();

        this.setUpMeshBuffer(this.meshBuffer);
        this.setUpParticleBuffer(this.particleBuffer);

        this.viewMatrix = this.updateViewMatrix();
    }

    start() {
        this.renderComputeLoop();
    }

    stop() {
        cancelAnimationFrame(this.rafId);
    }

    createConfettiInstances(generator: ConfettiGeneratorFunction, count: number) {
        let expectedAttributeCount = this.options.bufferLayout[1].layout.length;
        let particleData: number[] = [];

        for (let pi = 0, i = 0; pi < count; pi++) {
            let newData = generator(pi);

            if (newData.length !== expectedAttributeCount) {
                throw new Error(
                    `Confetti generator function did not return the expected number of attributes (got ${newData.length}, expected ${expectedAttributeCount})`
                );
            }

            for (let di = 0; di < newData.length; di++) {
                let type = this.options.bufferLayout[1].layout[di];
                let attributeSize = getAttributeTypeSize(type);
                if (attributeSize !== newData[di].length) {
                    throw new Error(
                        `Confetti generator function returned incorrected data length for attribute ${di} (${attributeArrayTypeToString(type)}) (expected ${attributeSize}, got ${newData[di].length})`
                    );
                }
            }

            particleData.push(...newData.flat());
        }

        // TODO append data onto particle buffer instead of recreating it

        console.log(particleData);

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.particleBuffer);
        this.context.bufferData(
            WebGL2RenderingContext.ARRAY_BUFFER,
            new Float32Array(particleData),
            WebGL2RenderingContext.DYNAMIC_DRAW
        );
        this.instanceCount = count;

        console.log('Created confetti instances');
    }

    deleteConfettiInstances() {
        throw new Error('Not Implemented!');
    }
}
