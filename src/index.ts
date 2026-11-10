import { attributeArrayTypeToString, getAttributeTypeSize } from './attribute-array-data';
import { getBufferStride, MeshBufferLayout, ParticleBufferLayout } from './buffer-layout';
import { ConfettiGeneratorFunction } from './confetti-generator-function';
import { Matrix, multiplyManyMatrices, scaleMatrix, translationMatrix } from './matrix-helper';
import { defaultOptions, InitOptions, Options } from './options';
import { getVaryingsFromComputeShader } from './shader-helper';
import { COMPUTE_FRAG_SOURCE, convertGLErrorToString, isPowerOf2 } from './utils';

export class ConfettiEngine {
    private context: WebGL2RenderingContext;
    private rafId: any = null;
    private options: Options;
    private instanceCount: number = 0;
    private viewMatrix: Matrix;

    private lastFrameEndTime: number = 0;

    private renderProgram: WebGLProgram;
    private computeProgram: WebGLProgram;

    private meshBuffer: WebGLBuffer;
    private particleBuffer: WebGLBuffer;
    private particlePingPongBuffer: WebGLBuffer;

    private renderVAO: WebGLVertexArrayObject;
    private renderPingPongVAO: WebGLVertexArrayObject;

    private computeVAO: WebGLVertexArrayObject;
    private computePingPongVAO: WebGLVertexArrayObject;

    private textures: WebGLTexture[] = [];

    readonly canvas: HTMLCanvasElement;

    private createCanvasAndAddToDOM(parent: HTMLElement): HTMLCanvasElement {
        let canvas = document.createElement('canvas');
        parent.appendChild(canvas);
        return canvas;
    }

    private getContextOrFail(canvas: HTMLCanvasElement) {
        let context = canvas.getContext('webgl2', {
            antialias: false,
            depth: false,
            desynchronized: true,
            preserveDrawingBuffer: true,
        });

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

    private buildShaderProgram(shaderVert: string, shaderFrag: string, varyings?: string[]): WebGLProgram {
        let program = this.context.createProgram();

        let vert = this.context.createShader(this.context.VERTEX_SHADER);
        if (!vert) throw new Error('Failed to create vertex shader!');

        let frag = this.context.createShader(this.context.FRAGMENT_SHADER);
        if (!frag) throw new Error('Failed to create fragment shader!');

        this.context.shaderSource(vert, shaderVert);
        this.context.compileShader(vert);
        this.readAndThrowShaderCompilationErrors(vert);

        this.context.shaderSource(frag, shaderFrag);
        this.context.compileShader(frag);
        this.readAndThrowShaderCompilationErrors(frag);

        this.context.attachShader(program, vert);
        this.context.attachShader(program, frag);

        if (varyings) {
            this.context.transformFeedbackVaryings(program, varyings, WebGL2RenderingContext.INTERLEAVED_ATTRIBS);
        }

        this.context.linkProgram(program);
        this.readAndThrowProgramLinkingErrors(program);

        return program;
    }

    private renderCompute() {
        // Note that in some browsers methods for getting current time are always innaccurate,
        // e.g. librewolf comes with resistfingerprinting enabled by default. This causes the
        // frame timing to be all over the place and can make the animation look jittery.

        let deltaTime = Date.now() - this.lastFrameEndTime;
        if (deltaTime > 66) {
            // If frame took longer than 66ms (< 15fps) then reset to 66
            // This is required because if the user leaves the tab, the animation frame
            // will be suspended and the animation will break.
            deltaTime = 66;
            console.warn('slow frame time');
        }

        this.renderPass();
        this.computePass(deltaTime);

        this.lastFrameEndTime = Date.now();
    }

    private renderPass() {
        this.resizeCanvasToClientSize();

        this.context.bindVertexArray(this.renderVAO);
        this.context.useProgram(this.renderProgram);

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

    private computePass(deltaTime: number) {
        this.context.bindVertexArray(this.computeVAO);
        this.context.useProgram(this.computeProgram);
        this.context.uniform1f(this.context.getUniformLocation(this.computeProgram, 'deltaTime'), deltaTime / 1000);
        this.context.enable(this.context.RASTERIZER_DISCARD);

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null);

        let transformFeedback = this.context.createTransformFeedback();
        this.context.bindTransformFeedback(this.context.TRANSFORM_FEEDBACK, transformFeedback);
        this.context.bindBufferBase(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, 0, this.particlePingPongBuffer);

        this.context.beginTransformFeedback(this.context.POINTS);
        this.context.drawArraysInstanced(this.context.POINTS, 0, 1, this.instanceCount);
        this.context.endTransformFeedback();

        this.context.bindTransformFeedback(this.context.TRANSFORM_FEEDBACK, null);
        this.context.deleteTransformFeedback(transformFeedback);
        this.context.disable(this.context.RASTERIZER_DISCARD);

        this.swapPingPongObjects();
    }

    private renderComputeLoop() {
        this.renderCompute();
        requestAnimationFrame(this.renderComputeLoop.bind(this));
    }

    private setUpMeshBuffer(vbo: WebGLBuffer) {
        let buffer = this.options.bufferLayout[0];

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
        let strideBytes = getBufferStride(buffer) * 4;
        let offsetBytes = 0;

        for (let attributeI in buffer.layout) {
            this.context.enableVertexAttribArray(attributeIndex);
            this.context.vertexAttribDivisor(attributeIndex, divisor);

            this.context.vertexAttribPointer(
                attributeIndex,
                getAttributeTypeSize(buffer.layout[attributeI]),
                buffer.types?.[attributeI] ?? WebGL2RenderingContext.FLOAT,
                false,
                strideBytes,
                offsetBytes
            );

            offsetBytes += getAttributeTypeSize(buffer.layout[attributeI]) * 4;
            attributeIndex++;
        }
    }

    private updateViewMatrix() {
        this.viewMatrix = multiplyManyMatrices(
            scaleMatrix(2 / this.context.canvas.width, 2 / this.context.canvas.height, 1.0),
            translationMatrix(-this.context.canvas.width / 2, -this.context.canvas.height / 2, 0)
        );

        this.context.useProgram(this.renderProgram);

        this.context.uniformMatrix4fv(
            this.context.getUniformLocation(this.renderProgram, 'viewMatrix'),
            false,
            this.viewMatrix.flat()
        );
        return this.viewMatrix;
    }

    private resizeCanvasToClientSize() {
        let displayWidth = Math.floor(this.canvas.clientWidth);
        let displayHeight = Math.floor(this.canvas.clientHeight);

        let needResize = this.canvas.width !== displayWidth || this.canvas.height !== displayHeight;

        if (needResize) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.viewMatrix = this.updateViewMatrix();
        }

        return needResize;
    }

    constructor(options: InitOptions) {
        // parentElement cannot be part of defaultOptions (it won't be available at the time of the script being loaded)
        this.options = { parentElement: document.body, ...defaultOptions, ...options };

        let parent = this.options.parentElement;
        this.canvas = this.options.canvas ?? this.createCanvasAndAddToDOM(parent);
        this.canvas.id ||= 'confetti-canvas-' + crypto.randomUUID(); // crypto uuids sometimes start with numbers, which is invalid for a CSS ID, lol

        if (this.options.fullscreen) {
            let canvasStyles = new CSSStyleSheet();

            //language=css
            canvasStyles.replaceSync(`
                #${this.canvas.id} {
                    position: fixed;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }
            `);

            document.adoptedStyleSheets.push(canvasStyles);
        }

        this.context = this.getContextOrFail(this.canvas);

        this.context.clearColor(0, 0, 0, 0);
        this.context.enable(WebGL2RenderingContext.BLEND);
        this.context.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
        this.context.enable(WebGL2RenderingContext.DEPTH_TEST);

        this.renderVAO = this.createVAO();
        this.computeVAO = this.createVAO();
        this.renderPingPongVAO = this.createVAO();
        this.computePingPongVAO = this.createVAO();

        this.meshBuffer = this.createVBO();
        this.particleBuffer = this.createVBO();
        this.particlePingPongBuffer = this.createVBO();

        let computeVaryings = getVaryingsFromComputeShader(this.options.shaderCompute);
        if (computeVaryings.length !== this.options.bufferLayout[1].layout.length) {
            throw new Error(
                `Failed to parse varyings from compute shader, expected ${this.options.bufferLayout[1].layout.length}, got ${computeVaryings.length} (${JSON.stringify(computeVaryings)})`
            );
        }

        for (let i = 0; i < computeVaryings.length; i++) {
            if (computeVaryings[i].sizeBytes !== getAttributeTypeSize(this.options.bufferLayout[1].layout[i])) {
                let type = this.options.bufferLayout[1].layout[i];
                throw new Error(
                    `Varying size mismatch, compute shader varying "${computeVaryings[i].name}" has size ${computeVaryings[i].sizeBytes} (${computeVaryings[i].type}), expected ${getAttributeTypeSize(type)} (${attributeArrayTypeToString(type)})`
                );
            }
        }

        this.renderProgram = this.buildShaderProgram(this.options.shaderVert, this.options.shaderFrag);
        this.computeProgram = this.buildShaderProgram(
            this.options.shaderCompute,
            COMPUTE_FRAG_SOURCE,
            computeVaryings.map((_) => _.name)
        );

        this.viewMatrix = this.updateViewMatrix();

        // Setting up renderVAO
        this.context.bindVertexArray(this.renderVAO);
        this.setUpMeshBuffer(this.meshBuffer);
        this.setUpParticleBuffer(this.particleBuffer);

        // Setting up computeVAO
        this.context.bindVertexArray(this.computeVAO);
        this.setUpParticleBuffer(this.particleBuffer);

        // Setting up renderPingPongVAO
        this.context.bindVertexArray(this.renderPingPongVAO);
        this.setUpMeshBuffer(this.meshBuffer);
        this.setUpParticleBuffer(this.particlePingPongBuffer);

        // Setting up computePingPongVAO
        this.context.bindVertexArray(this.computePingPongVAO);
        this.setUpParticleBuffer(this.particlePingPongBuffer);
    }

    start() {
        this.stop();
        this.renderComputeLoop();
    }

    stop() {
        cancelAnimationFrame(this.rafId);
    }

    swapPingPongObjects() {
        let otherVAO = this.computeVAO;
        this.computeVAO = this.computePingPongVAO;
        this.computePingPongVAO = otherVAO;

        let otherBuffer = this.particleBuffer;
        this.particleBuffer = this.particlePingPongBuffer;
        this.particlePingPongBuffer = otherBuffer;

        let otherRenderVAO = this.renderVAO;
        this.renderVAO = this.renderPingPongVAO;
        this.renderPingPongVAO = otherRenderVAO;
    }

    // Loads an image from a URL into the next WebGL texture unit
    loadTextureFromURL(url: string) {
        let textureId = this.context.createTexture();
        if (!textureId) {
            console.warn(
                'Failed to create webgl texture, it may not be supported by the browser (Engine will continue to render)'
            );
            return;
        }

        const level = 0;
        const internalFormat = WebGL2RenderingContext.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = WebGL2RenderingContext.RGBA;
        const srcType = WebGL2RenderingContext.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 255, 255, 255]);

        this.context.bindTexture(WebGL2RenderingContext.TEXTURE_2D, textureId);
        this.context.texImage2D(
            WebGL2RenderingContext.TEXTURE_2D,
            level,
            internalFormat,
            width,
            height,
            border,
            srcFormat,
            srcType,
            pixel
        );

        let image = new Image();
        image.src = url;
        image.addEventListener('load', () => {
            this.context.bindTexture(WebGL2RenderingContext.TEXTURE_2D, textureId);
            this.context.texImage2D(
                WebGL2RenderingContext.TEXTURE_2D,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image
            );

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                this.context.generateMipmap(WebGL2RenderingContext.TEXTURE_2D);
            } else {
                this.context.texParameteri(
                    WebGL2RenderingContext.TEXTURE_2D,
                    WebGL2RenderingContext.TEXTURE_WRAP_S,
                    WebGL2RenderingContext.CLAMP_TO_EDGE
                );
                this.context.texParameteri(
                    WebGL2RenderingContext.TEXTURE_2D,
                    WebGL2RenderingContext.TEXTURE_WRAP_T,
                    WebGL2RenderingContext.CLAMP_TO_EDGE
                );
                this.context.texParameteri(
                    WebGL2RenderingContext.TEXTURE_2D,
                    WebGL2RenderingContext.TEXTURE_MIN_FILTER,
                    WebGL2RenderingContext.LINEAR
                );
            }
        });

        this.textures.push(textureId);

        this.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + this.textures.length - 1);
        this.context.bindTexture(WebGL2RenderingContext.TEXTURE_2D, textureId);

        let location = this.context.getUniformLocation(this.renderProgram, `texture_${this.textures.length - 1}`);
        this.context.uniform1i(location, this.textures.length - 1);
    }

    createConfettiInstances(generator: ConfettiGeneratorFunction, count: number) {
        let expectedAttributeCount = this.options.bufferLayout[1].layout.length;
        let particleData: number[] = [];

        for (let pi = 0; pi < count; pi++) {
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

        let newBufferSize =
            (this.instanceCount + count) *
            getBufferStride(this.options.bufferLayout[1]) *
            Float32Array.BYTES_PER_ELEMENT;

        let oldBufferSize =
            this.instanceCount * getBufferStride(this.options.bufferLayout[1]) * Float32Array.BYTES_PER_ELEMENT;

        this.instanceCount += count;

        this.context.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, this.particleBuffer);
        this.context.bindBuffer(WebGL2RenderingContext.COPY_WRITE_BUFFER, this.particlePingPongBuffer);

        this.context.bufferData(WebGL2RenderingContext.COPY_WRITE_BUFFER, newBufferSize, this.context.DYNAMIC_DRAW);
        this.context.copyBufferSubData(
            WebGL2RenderingContext.COPY_READ_BUFFER,
            WebGL2RenderingContext.COPY_WRITE_BUFFER,
            0,
            0,
            oldBufferSize
        );

        this.context.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null);
        this.context.bindBuffer(WebGL2RenderingContext.COPY_WRITE_BUFFER, null);

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.particlePingPongBuffer);
        this.context.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, oldBufferSize, new Float32Array(particleData));

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.particleBuffer);
        this.context.bufferData(
            WebGL2RenderingContext.ARRAY_BUFFER,
            newBufferSize,
            WebGL2RenderingContext.DYNAMIC_DRAW
        );

        this.swapPingPongObjects();
    }

    deleteConfettiInstances() {
        throw new Error('Not Implemented!');
    }
}
