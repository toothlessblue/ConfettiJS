import { AttributeArrayType, attributeArrayTypeToString, getAttributeTypeSize } from './attribute-array-data';
import { AttributeData, BufferLayout, bufferLayoutToMeshData, DataLayout, getAttributeOffsetBytes, getBufferStride } from './buffer-layout';
import { initCanvas } from './canvas-helper';
import { Matrix, multiplyManyMatrices, scaleMatrix, translationMatrix } from './matrix-helper';
import { defaultOptions, InitOptions, Options } from './options';
import { ParticleGeneratorFunction } from './particle-generator-function';
import { getVaryingsFromComputeShader, parseShaderForBufferLayout, VaryingInfo } from './shader-helper';
import { COMPUTE_FRAG_SOURCE, convertGLErrorToString, isPowerOf2, uniqueOf } from './utils';
import { Webgl2ContextHelper } from './web-gl-helper';

/**
 * The main engine for generating and rendering particle.
 * @extends ConfettiEngine
 */
export class ConfettiEngine {
    // Miscellaneous variables 
    private rafId: any = null;
    private options: Options;
    private instanceCount: number = 0;
    private viewMatrix: Matrix;
    private lastFrameEndTime: number = 0;

    // WebGL identifiers
    private context: WebGL2RenderingContext;
    private contextHelper: Webgl2ContextHelper;

    private renderProgram: WebGLProgram;
    private computeProgram: WebGLProgram;

    private renderVAO: WebGLVertexArrayObject;
    private computeVAO: WebGLVertexArrayObject;
    private meshBuffer: WebGLBuffer;
    private particleBuffer: WebGLBuffer;

    private nextComputeVAO: WebGLVertexArrayObject;
    private nextRenderVAO: WebGLVertexArrayObject;
    private nextParticleBuffer: WebGLBuffer;

    private textures: WebGLTexture[] = [];

    // Contains the locations that vertex attributes are pointed to (parsed from the shader)
    private renderLayout: DataLayout;
    private computeLayout: DataLayout;

    // Contains the aggregate layouts of the render program + the compute program, 
    private particleBufferLayout: AttributeData[];

    readonly canvas: HTMLCanvasElement;

    /**
     * Retrieves the WebGL2 rendering context from a canvas element.
     * @param canvas - The canvas element to get the context from.
     * @returns The WebGL2 rendering context.
     * @throws Error if the context cannot be retrieved.
     */
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

    /**
     * Calculates the delta time since the last frame.
     * @returns The delta time in milliseconds.
     */
    private calculateDeltaTime() {
        if (this.options.assumeFrameTime) {
            return this.options.assumeFrameTime;
        }

        // Note that in some browsers methods for getting current time are always innaccurate,
        // e.g. librewolf comes with resistfingerprinting enabled by default. This causes the
        // frame timing to be all over the place and can make the animation look jittery.
        // (This is what "assumeFrameTime" is for.)
        let deltaTime = Date.now() - this.lastFrameEndTime;
        if (deltaTime > 66) {
            // If frame took longer than 66ms (< 15fps) then reset to 66
            // This is required because if the user leaves the tab, the animation frame
            // will be suspended and the animation will break.
            deltaTime = 66;
        }

        return deltaTime
    }

    /**
     * Performs both the render and compute passes.
     */
    private renderCompute() {
        this.renderPass();
        this.computePass(this.calculateDeltaTime());

        this.lastFrameEndTime = Date.now();
    }

    /**
     * Performs the render pass of the particle.
     */
    private renderPass() {
        this.context.bindVertexArray(this.renderVAO);
        this.context.useProgram(this.renderProgram);

        this.context.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

        this.context.drawArraysInstanced(
            WebGL2RenderingContext.TRIANGLES,
            0,
            this.options.mesh.getVertexCount(),
            this.instanceCount
        );
        this.contextHelper.checkWebglError();

        this.context.flush();
    }

    /**
     * Performs the compute pass for the particle particles.
     * @param deltaTime - The delta time since the last frame.
     */
    private computePass(deltaTime: number) {
        this.context.bindVertexArray(this.computeVAO);
        this.context.useProgram(this.computeProgram);
        this.context.uniform1f(this.context.getUniformLocation(this.computeProgram, 'deltaTime'), deltaTime / 1000);
        this.context.enable(this.context.RASTERIZER_DISCARD);

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null);

        let transformFeedback = this.context.createTransformFeedback();
        this.context.bindTransformFeedback(this.context.TRANSFORM_FEEDBACK, transformFeedback);
        this.context.bindBufferBase(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, 0, this.nextParticleBuffer);

        this.context.beginTransformFeedback(this.context.POINTS);
        this.context.drawArraysInstanced(this.context.POINTS, 0, 1, this.instanceCount);
        this.context.endTransformFeedback();

        this.context.bindTransformFeedback(this.context.TRANSFORM_FEEDBACK, null);
        this.context.deleteTransformFeedback(transformFeedback);
        this.context.disable(this.context.RASTERIZER_DISCARD);

        this.swapBuffersVAOs();
    }

    /**
     * The main render loop using `requestAnimationFrame`.
     */
    private renderComputeLoop() {
        this.renderCompute();
        requestAnimationFrame(this.renderComputeLoop.bind(this));
    }

    /**
     * Sets up the mesh buffer with the specified layout.
     * @param vbo - The vertex buffer object.
     * @param layout - The layout of the mesh data.
     */
    private setUpMeshBuffer(vbo: WebGLBuffer, layout: DataLayout) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        this.context.bufferData(
            WebGL2RenderingContext.ARRAY_BUFFER,
            this.options.mesh.getMeshData(bufferLayoutToMeshData(layout.mesh)),
            WebGL2RenderingContext.STATIC_DRAW
        );

        this.applyBufferAttributes(layout.mesh, 0);
    }

    /**
     * Sets up the particle buffer with the specified layout.
     * @param vbo - The vertex buffer object.
     * @param layout - The layout of the particle data.
     */
    private setUpParticleBuffer(vbo: WebGLBuffer, layout: DataLayout) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        this.applyParticleBufferAttributes(layout.particle, 1);
    }

    /**
     * Applies vertex attributes to the current VAO.
     * @param layout - The layout of the buffer attributes.
     * @param divisor - The vertex attribute divisor (e.g., 1 for instance data).
     */
    private applyBufferAttributes(layout: BufferLayout, divisor: number) {
        let strideBytes = getBufferStride(layout) * 4;
        let offsetBytes = 0;

        for (let attributeI in layout) {
            this.context.enableVertexAttribArray(layout[attributeI].location);
            this.context.vertexAttribDivisor(layout[attributeI].location, divisor);

            this.context.vertexAttribPointer(
                layout[attributeI].location,
                getAttributeTypeSize(layout[attributeI].type),
                WebGL2RenderingContext.FLOAT,
                false,
                strideBytes,
                offsetBytes
            );

            offsetBytes += getAttributeTypeSize(layout[attributeI].type) * 4;
        }
    }

    /**
     * Applies particle vertex attributes to the current VAO.
     * @param layout - The layout of the particle buffer attributes.
     * @param divisor - The vertex attribute divisor (e.g., 1 for instance data).
     */
    private applyParticleBufferAttributes(layout: BufferLayout, divisor: number) {
        let strideBytes = getBufferStride(this.particleBufferLayout) * 4;

        for (let attributeI in layout) {
            this.context.enableVertexAttribArray(layout[attributeI].location);
            this.context.vertexAttribDivisor(layout[attributeI].location, divisor);

            this.context.vertexAttribPointer(
                layout[attributeI].location,
                getAttributeTypeSize(layout[attributeI].type),
                WebGL2RenderingContext.FLOAT,
                false,
                strideBytes,
                getAttributeOffsetBytes(layout[attributeI].name, this.particleBufferLayout),
            );
        }
    }

    /**
     * Updates the view matrix based on the canvas dimensions.
     * @returns The updated view matrix.
     */
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

    /**
     * Ensures that the varyings in the compute shader are in the correct order.
     * @param varyings - The varyings extracted from the compute shader.
     * @throws Error if the varyings are missing or in the wrong order.
     */
    private ensureVaryingsCorrectOrder(varyings: VaryingInfo[]) {
        if (varyings.length !== this.particleBufferLayout.length) {
            let missing = this.particleBufferLayout.find(_=>!varyings.map(varying=>varying.name).includes('out_' + _.name));
            if (!missing) {
                throw new Error(`Missing varying in compute shader, but cannot identify which one (this error shouldn't be reachable, please report an issue on github with a minimal reproduction)`);
            }

            throw new Error(`Missing varyings in compute shader, must include this exact varying definition: out ${attributeArrayTypeToString(missing.type).toLowerCase()} out_${missing.name};`)
        }

        for (let i in this.particleBufferLayout) {
            if ('out_' + this.particleBufferLayout[i].name !== varyings[i].name) {
                throw new Error(`Varyings unexpected ordering, ensure they appear in the following order with the correct naming in the compute shader:\n${this.particleBufferLayout.map(_ => `out ${attributeArrayTypeToString(_.type).toLowerCase()} out_${_.name};`).join('\n')}`);
            }
        }
    }

    /**
     * Ensures that the compute shader consumes the correct number of elements.
     * @throws Error if the compute shader does not match the expected layout.
     */
    private ensureComputeShaderCorrectness() {
        if (this.computeLayout.particle.length !== this.particleBufferLayout.length) {
            let missing = this.particleBufferLayout.filter(_ => !this.computeLayout.particle.find(__=>__.name === _.name)).map(_ => _.name);
            throw new Error(`Ensure the compute shader consumes the exact number of elements expected for the particle buffer. Got ${this.computeLayout.particle.length}, expected ${this.particleBufferLayout.length}, missing: ${missing.join(', ')}`)
        }
    }

    constructor(options: InitOptions) {
        // parentElement cannot be part of defaultOptions (it won't be available at the time of the script being loaded)
        this.options = { parentElement: document.body, ...defaultOptions, ...options };

        this.renderLayout = parseShaderForBufferLayout(this.options.shaderVert);
        this.computeLayout = parseShaderForBufferLayout(this.options.shaderCompute);
        this.particleBufferLayout = uniqueOf([...this.renderLayout.particle, ...this.computeLayout.particle], (v) => v.name);

        this.ensureComputeShaderCorrectness();

        this.canvas = initCanvas(this.options, this.resizeCanvas.bind(this));

        this.context = this.getContextOrFail(this.canvas);
        this.contextHelper = new Webgl2ContextHelper(this.context);
        this.context.clearColor(0, 0, 0, 0);
        this.context.enable(WebGL2RenderingContext.BLEND);
        this.context.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
        this.context.enable(WebGL2RenderingContext.DEPTH_TEST);

        this.renderVAO = this.contextHelper.createVAO();
        this.computeVAO = this.contextHelper.createVAO();
        this.nextRenderVAO = this.contextHelper.createVAO();
        this.nextComputeVAO = this.contextHelper.createVAO();

        this.meshBuffer = this.contextHelper.createVBO();
        this.particleBuffer = this.contextHelper.createVBO();
        this.nextParticleBuffer = this.contextHelper.createVBO();

        let computeVaryings = getVaryingsFromComputeShader(this.options.shaderCompute);
        this.ensureVaryingsCorrectOrder(computeVaryings);
        if (computeVaryings.length !== this.computeLayout.particle.length) {
            throw new Error(
                `Failed to parse varyings from compute shader, expected ${this.computeLayout.particle.length}, got ${computeVaryings.length} (${JSON.stringify(computeVaryings)})`
            );
        }

        for (let i = 0; i < computeVaryings.length - 1; i++) {
            if (computeVaryings[i].sizeBytes !== getAttributeTypeSize(this.particleBufferLayout[i].type)) {
                let type = this.computeLayout.particle[i].type;
                throw new Error(
                    `Varying size mismatch, compute shader varying "${computeVaryings[i].name}" has size ${computeVaryings[i].sizeBytes} (${computeVaryings[i].type}), expected ${getAttributeTypeSize(type)} (${attributeArrayTypeToString(type)})`
                );
            }
        }

        this.renderProgram = this.contextHelper.buildShaderProgram(this.options.shaderVert, this.options.shaderFrag);
        this.computeProgram = this.contextHelper.buildShaderProgram(
            this.options.shaderCompute,
            COMPUTE_FRAG_SOURCE,
            computeVaryings.map((_) => _.name)
        );

        // Setting up renderVAO
        this.context.bindVertexArray(this.renderVAO);
        this.setUpMeshBuffer(this.meshBuffer, this.renderLayout);
        this.setUpParticleBuffer(this.particleBuffer, this.renderLayout);

        // Setting up computeVAO
        this.context.bindVertexArray(this.computeVAO);
        this.setUpParticleBuffer(this.particleBuffer, this.computeLayout);

        // Setting up nextRenderVAO
        this.context.bindVertexArray(this.nextRenderVAO);
        this.setUpMeshBuffer(this.meshBuffer, this.renderLayout);
        this.setUpParticleBuffer(this.nextParticleBuffer, this.renderLayout);

        // Setting up nextComputeVAO
        this.context.bindVertexArray(this.nextComputeVAO);
        this.setUpParticleBuffer(this.nextParticleBuffer, this.computeLayout);

        this.viewMatrix = this.updateViewMatrix();
    }

    resizeCanvas(width: number, height: number) {
        let displayWidth = Math.floor(width);
        let displayHeight = Math.floor(height);

        let needResize = this.canvas.width !== displayWidth || this.canvas.height !== displayHeight;

        if (needResize) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.viewMatrix = this.updateViewMatrix();
        }

        return needResize;
    }

    /**
     * Starts the particle animation.
     */
    start() {
        this.stop();
        this.renderComputeLoop();
    }

    /**
     * Stops the particle animation.
     */
    stop() {
        cancelAnimationFrame(this.rafId);
    }

    /**
     * Swaps the ping-pong buffers and VAOs for the compute pass.
     */
    swapBuffersVAOs() {
        let otherVAO = this.computeVAO;
        this.computeVAO = this.nextComputeVAO;
        this.nextComputeVAO = otherVAO;

        let otherParticleBuffer = this.particleBuffer;
        this.particleBuffer = this.nextParticleBuffer;
        this.nextParticleBuffer = otherParticleBuffer;

        let otherRenderVAO = this.renderVAO;
        this.renderVAO = this.nextRenderVAO;
        this.nextRenderVAO = otherRenderVAO;

    }

    // Loads an image from a URL into the next WebGL texture unit
    /**
     * Loads an image from a URL into a WebGL texture.
     * @param url - The URL of the image to load.
     * @param customUniformName - Optional custom name for the texture uniform.
     */
    loadTextureFromURL(url: string, customUniformName?: string) {
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

        let uniformName = customUniformName ?? `texture_${this.textures.length - 1}`;
        let location = this.context.getUniformLocation(this.renderProgram, uniformName);
        this.context.uniform1i(location, this.textures.length - 1);
    }

    /**
     * Creates new particle instances.
     * @param count - The number of instances to create.
     * @param generator - The function used to generate the data for each instance.
     */
    createParticleInstances(count: number, generator: ParticleGeneratorFunction) {
        let particleData: number[] = [];

        for (let pi = 0; pi < count; pi++) {
            let newData = generator(pi);

            for (let attribute of this.particleBufferLayout) {
                let size = getAttributeTypeSize(attribute.type);
                let value = newData[attribute.name] ?? new Float32Array(size);
                
                if (value.length !== size) {
                    throw new Error(`Expected ${size} elements for attribute ${attribute.name} (type of ${attributeArrayTypeToString(attribute.type)}), got ${value.length}`);
                }

                for (let component of value) {
                    particleData.push(component);
                }
            }
        }

        let particleBufferStride = getBufferStride(this.particleBufferLayout);

        let newBufferSize = (this.instanceCount + count) * particleBufferStride * Float32Array.BYTES_PER_ELEMENT;
        let oldBufferSize = this.instanceCount * particleBufferStride * Float32Array.BYTES_PER_ELEMENT;

        this.instanceCount += count;

        this.context.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, this.particleBuffer);
        this.context.bindBuffer(WebGL2RenderingContext.COPY_WRITE_BUFFER, this.nextParticleBuffer);

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

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.nextParticleBuffer);
        this.context.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, oldBufferSize, new Float32Array(particleData));

        this.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.particleBuffer);
        this.context.bufferData(
            WebGL2RenderingContext.ARRAY_BUFFER,
            newBufferSize,
            WebGL2RenderingContext.DYNAMIC_DRAW
        );

        this.swapBuffersVAOs();
    }

    /**
     * Deletes all particle instances.
     * @throws Error because this is currently not implemented.
     */
    deleteParticleInstances() {
        throw new Error('Not Implemented!');
    }
}
