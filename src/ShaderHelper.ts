export function createShader(gl: WebGL2RenderingContext, type: 35633 | 35632, source: string) {
    let shader = gl.createShader(type);

    if (!shader) {
        throw new Error('Failed to create shader!');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error('Failed to compile shader!');
    }

    return shader;
}

export function createShaderProgram(gl: WebGL2RenderingContext, vert: WebGLShader, frag: WebGLShader) {
    let program = gl.createProgram();

    if (!program) {
        throw new Error('Failed to create shader program!');
    }

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    return program;
}

export function linkShaderProgram(gl: WebGL2RenderingContext, program: WebGLProgram) {
    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        throw new Error('Failed to link shader program!');
    }
}