import {resizeCanvasToDisplaySize, spawnCanvas} from './CanvasHelper';
import {simple_frag, simple_vert} from './shaders/ShaderSimple';
import {randomFromArray, randomRange, repeat} from './utils';
import {eulerMatrix, Matrix, multiplyManyMatrices, scaleMatrix, translationMatrix} from './MatrixHelper';
import {particlePhysics_frag, particlePhysics_vert} from './shaders/ParticlePhysics';
import {ShaderProgram} from './ShaderProgram';
import {randomDirection2d} from './VectorHelper';
import {Texture} from './Texture';
import {parseOBJ} from './OBJHelper';
import foilNormalURL from './foil-normal-128.png';
import confettiOBJ from './confetti.obj';

console.log(confettiOBJ);
console.log(parseOBJ(confettiOBJ));

export interface ConfettiInitData {
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number, number];
    velocity: [number, number, number];
    rotationalVelocity: [number, number, number];
}

const bufferStride = 112;

class ConfettiChunk {
    private confetti: Confetti;

    spawned: boolean = false;
    id: number | null = null;
    offset: number | null = null;
    count: number | null = null;

    constructor(confetti: Confetti) {
        this.confetti = confetti;
    }

    delete() {
        this.confetti.deleteInstances(this);
    }
}

export class Confetti {
    renderRatio = 1;
    instances = 0;

    confettiChunks: ConfettiChunk[] = [];
    nextConfettiChunkId: number = 0;

    confettiVerticesUV = new Float32Array([
        -1.0, -1.0, -3.0, 0, 0,
        -1.0, 1.0, 0.0, 0, 1,
        1.0, -1.0, 0.0, 1, 0,

        1.0, -1.0, 0.0, 1, 0,
        -1.0, 1.0, 0.0, 0, 1,
        1.0, 1.0, -3.0, 1, 1,
    ]);

    gl: WebGL2RenderingContext;

    confettiVertexBuffer!: WebGLBuffer;
    dataBuffer!: WebGLBuffer;
    updateBuffer!: WebGLBuffer;

    viewMatrix!: Matrix;

    renderVAO: WebGLVertexArrayObject;
    computeVAO: WebGLVertexArrayObject;

    renderProgram!: ShaderProgram;
    computeProgram!: ShaderProgram;

    instanceQueue: (() => void)[] = [];

    constructor() {
        this.gl = spawnCanvas();

        this.gl.clearColor(0, 0, 0, 0);

        this.renderProgram = new ShaderProgram(this.gl, simple_vert, simple_frag);
        this.computeProgram = new ShaderProgram(this.gl, particlePhysics_vert, particlePhysics_frag, ['out_translation', 'out_scale', 'out_velocity', 'out_rotationalVelocity']);

        this.computeProgram.uniform2fv('canvasSize', [this.gl.canvas.width / this.renderRatio, this.gl.canvas.height / this.renderRatio]);

        let normalTexture = new Texture(this.gl, foilNormalURL);
        normalTexture.bind(0);
    
        this.renderProgram.uniform4fv('lightColour', [1, 1, 1, 1]);

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

    private setupRenderVAO() {
        this.renderVAO = this.createDefiniteVao();

        this.gl.bindVertexArray(this.renderVAO);

        this.gl.enableVertexAttribArray(0);
        this.gl.enableVertexAttribArray(1);
        this.gl.enableVertexAttribArray(2);
        this.gl.enableVertexAttribArray(3);
        this.gl.enableVertexAttribArray(4);
        this.gl.enableVertexAttribArray(5);
        this.gl.enableVertexAttribArray(6);

        this.gl.vertexAttribDivisor(0, 1);
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

        this.gl.vertexAttribDivisor(0, 1);
        this.gl.vertexAttribDivisor(1, 1);
        this.gl.vertexAttribDivisor(2, 1);
        this.gl.vertexAttribDivisor(3, 1);
        this.gl.vertexAttribDivisor(4, 1);
        this.gl.vertexAttribDivisor(5, 1);
        this.gl.vertexAttribDivisor(6, 1);
    }

    private updateViewport() {
        resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement, this.renderRatio);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }

    private updateViewMatrix() {
        this.viewMatrix = multiplyManyMatrices(
            scaleMatrix(this.renderRatio * 2 / this.gl.canvas.width, this.renderRatio * 2 / this.gl.canvas.height, 0),
            translationMatrix(-this.gl.canvas.width / (this.renderRatio * 2), -this.gl.canvas.height / (this.renderRatio * 2), 0),
        );

        this.renderProgram.uniformMatrix4fv('viewMatrix', this.viewMatrix.flat());
    }

    private initialiseVertexBuffer() {
        this.confettiVertexBuffer = this.createDefiniteBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.confettiVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.confettiVerticesUV, this.gl.STATIC_DRAW);

    }

    private initialiseDataBuffers() {
        this.dataBuffer = this.createDefiniteBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dataBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, 0, this.gl.DYNAMIC_DRAW);

        this.updateBuffer = this.createDefiniteBuffer();
    }

    createInstances(generator: (index: number) => ConfettiInitData, count: number): ConfettiChunk {
        let initData = new Float32Array(repeat(i => {
            let data = generator(i);

            data.position[1] = (this.gl.canvas.height / this.renderRatio) - data.position[1];

            return [
                // translation matrix
                multiplyManyMatrices(
                    translationMatrix(...data.position),
                    eulerMatrix(...data.rotation),
                ),
                // scale vector
                data.size, 1,
                // velocity vector
                data.velocity, 0,
                // rotational velocity vector
                data.rotationalVelocity, 0,
            ];
        }, count).flat(3));

        let chunk = new ConfettiChunk(this);

        this.instanceQueue.push(() => {
            console.time(`add operation (${this.instances + count} confetti) (+${count})`);

            let size = bufferStride * this.instances;

            this.instances += count;

            this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.dataBuffer);

            let newBuffer = this.createDefiniteBuffer();
            this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, newBuffer);
            this.gl.bufferData(this.gl.COPY_WRITE_BUFFER, size + initData.length * 4, this.gl.DYNAMIC_DRAW);

            this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, 0, 0, size);

            this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, null);
            this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, null);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, newBuffer);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, size, initData);

            this.gl.deleteBuffer(this.dataBuffer);
            this.dataBuffer = newBuffer;

            // Resize secondary buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.updateBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferStride * this.instances, this.gl.DYNAMIC_DRAW);

            chunk.spawned = true;
            chunk.count = count;
            chunk.id = this.nextConfettiChunkId++;
            chunk.offset = this.instances - count;

            console.timeEnd(`add operation (${this.instances} confetti) (+${count})`);
        });

        this.confettiChunks.push(chunk);
        return chunk;
    }

    deleteInstances(toDelete: ConfettiChunk) {
        this.instanceQueue.push(() => {
            if (!toDelete.spawned || toDelete.count === null || toDelete.offset === null || toDelete.id === null) return;

            const timerName = `remove operation (${toDelete.id})`;
            console.time(timerName);

            let dataBufferSize = this.instances * bufferStride;

            this.instances -= toDelete.count;

            let newBuffer = this.createDefiniteBuffer();
            this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, newBuffer);
            this.gl.bufferData(this.gl.COPY_WRITE_BUFFER, this.instances * bufferStride, this.gl.DYNAMIC_DRAW);

            this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.dataBuffer);

            // Copy data before the deleting chunk
            this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, 0, 0, toDelete.offset * bufferStride);

            // Copy data after the deleting chunk
            this.gl.copyBufferSubData(
                this.gl.COPY_READ_BUFFER,
                this.gl.COPY_WRITE_BUFFER,
                (toDelete.offset * bufferStride) + (toDelete.count * bufferStride), // read
                toDelete.offset * bufferStride, // write
                dataBufferSize - (toDelete.offset * bufferStride) - (toDelete.count * bufferStride), // size
            );

            this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, null);
            this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, null);

            this.gl.deleteBuffer(this.dataBuffer);
            this.dataBuffer = newBuffer;

            this.confettiChunks.splice(this.confettiChunks.findIndex((i) => i.id === toDelete.id), 1);

            for (let chunk of this.confettiChunks) {
                if (!chunk.spawned) continue;
                if (chunk.offset && chunk.offset > toDelete.offset) {
                    chunk.offset -= toDelete.count;
                }
            }

            toDelete.spawned = false;

            console.timeEnd(timerName);
        });
    }

    render() {
        this.gl.bindVertexArray(this.renderVAO);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dataBuffer);

        // Translation matrix
        this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, bufferStride, 0);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, bufferStride, 16);
        this.gl.vertexAttribPointer(2, 4, this.gl.FLOAT, false, bufferStride, 32);
        this.gl.vertexAttribPointer(3, 4, this.gl.FLOAT, false, bufferStride, 48);

        // scale vector
        this.gl.vertexAttribPointer(4, 4, this.gl.FLOAT, false, bufferStride, 64);

        // position vector
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.confettiVertexBuffer);
        this.gl.vertexAttribPointer(5, 3, this.gl.FLOAT, false, 20, 0);
        this.gl.vertexAttribPointer(6, 2, this.gl.FLOAT, false, 20, 12);

        this.renderProgram.use();
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // this.updateViewport();
        // this.updateViewMatrix();

        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, this.instances);
    }

    compute() {
        this.gl.bindVertexArray(this.computeVAO);
        // this.computeProgram.uniform2fv('canvasSize', [this.gl.canvas.width / this.renderRatio, this.gl.canvas.height / this.renderRatio]);
        this.computeProgram.use();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.dataBuffer);

        // Translation binding
        this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, bufferStride, 0);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, bufferStride, 16);
        this.gl.vertexAttribPointer(2, 4, this.gl.FLOAT, false, bufferStride, 32);
        this.gl.vertexAttribPointer(3, 4, this.gl.FLOAT, false, bufferStride, 48);

        // scale binding
        this.gl.vertexAttribPointer(4, 4, this.gl.FLOAT, false, bufferStride, 64);

        // Velocity binding
        this.gl.vertexAttribPointer(5, 4, this.gl.FLOAT, false, bufferStride, 80);

        // Rotational velocity binding
        this.gl.vertexAttribPointer(6, 4, this.gl.FLOAT, false, bufferStride, 96);

        let transformFeedback = this.gl.createTransformFeedback();
        this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, transformFeedback);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.updateBuffer);
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

        let other = this.dataBuffer;
        this.dataBuffer = this.updateBuffer;
        this.updateBuffer = other;
    }

    loop() {
        for (let instanceQueueOperation of this.instanceQueue) {
            instanceQueueOperation();
        }

        this.instanceQueue = [];

        this.compute();
        this.render();
        this.gl.flush();

        requestAnimationFrame(() => {
            this.loop();
        });
    }
}

let confetti = new Confetti();
confetti.loop();

confetti.gl.canvas.addEventListener('click', ((e: MouseEvent) => {
    let angle = randomRange(-25, 25);

    let chunk = confetti.createInstances(
        (i) => {
            let velocity = 20 + Math.random() * 80;

            return {
                position: [
                    e.clientX,
                    e.clientY,
                    0,
                ],
                rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                ],
                size: randomFromArray([
                    [3, 3, 1],
                    [3, 6, 1],
                    [3, 9, 1],
                    [6, 6, 1],
                ]),
                velocity: [
                    ...randomDirection2d(-45 + angle, 45 + angle).map(_ => _ * velocity),
                    0,
                ] as [number, number, number],
                rotationalVelocity: [
                    randomRange(-0.1, 0.1),
                    randomRange(-0.1, 0.1),
                    randomRange(-0.1, 0.1),
                ],
            };
        }, 500,
    );

    setTimeout(() => {
        chunk.delete();
    }, 20000);
}) as any);