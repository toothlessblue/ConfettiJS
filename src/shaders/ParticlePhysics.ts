//language=GLSL
export const particlePhysics_vert = `#version 300 es

precision highp float;

uniform vec2 canvasSize;

layout (location = 0) in mat4 in_translation;
layout (location = 4) in mat4 in_velocity;

out mat4 out_translation;
out mat4 out_velocity;

mat4 translationMat4(float x, float y, float z) {
    return mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
    );
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    mat4 gravityMat = translationMat4(
    2.0f * rand(vec2(in_translation[3][0], in_translation[3][1])) - 1.0f,
    -rand(vec2(in_translation[3][0], in_translation[3][1])),
    0.0f
    ) * 1.0f;

    mat4 translation = in_translation;
    mat4 velocity = gravityMat * in_velocity;

    if (translation[3][1] < 0.0f) {
        translation = translationMat4(0.0f, 1578.0f, 0.0f) * translation;
        velocity = mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
        );
    }

    if (translation[3][0] > 2208.0f) {
        translation = translationMat4(-2208.0f, 0.0f, 0.0f) * translation;
    }

    if (translation[3][0] < 0.0f) {
        translation = translationMat4(2208.0f, 0.0f, 0.0f) * translation;
    }

    out_velocity = velocity;
    out_translation = velocity * translation;
}
`;

//language=GLSL
export const particlePhysics_frag = `#version 300 es
precision highp float;

out vec4 outColor;
void main() {
    outColor = vec4(0, 0, 0, 0);
}
`;