import {createShader, createShaderProgram, linkShaderProgram} from './ShaderHelper';
import {particlePhysics_frag, particlePhysics_vert} from './shaders/ParticlePhysics';

export function runComputeParticlePhysics(gl: WebGL2RenderingContext, instances: number, inBuffer: WebGLBuffer): WebGLBuffer {
    let vert = createShader(gl, gl.VERTEX_SHADER, particlePhysics_vert);
    let frag = createShader(gl, gl.FRAGMENT_SHADER, particlePhysics_frag);

    let program = createShaderProgram(gl, vert, frag);

    gl.transformFeedbackVaryings(
        program,
        ['out_translation'],
        gl.INTERLEAVED_ATTRIBS,
    );

    linkShaderProgram(gl, program);

    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.vertexAttribDivisor(0, 1);
    gl.vertexAttribDivisor(1, 1);
    gl.vertexAttribDivisor(2, 1);
    gl.vertexAttribDivisor(3, 1);

    // data buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, inBuffer);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 64, 0);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 64, 16);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 64, 32);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 64, 48);

    let transformFeedback = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    let outBuffer = gl.createBuffer();
    if (!outBuffer) throw new Error('Failed to create out buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, outBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 64 * instances, gl.STATIC_DRAW);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outBuffer);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    // Do the computation

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArraysInstanced(gl.POINTS, 0, 1, instances);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);

    return outBuffer;
}