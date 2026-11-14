export const basicShader_vert = `#version 300 es
precision highp float;

uniform mat4 viewMatrix;

layout (location = 0) in vec3 modelPosition;
layout (location = 1) in vec3 modelNormal;
layout (location = 2) in vec2 modelUv;

layout (location = 3) in vec3 particlePosition;
layout (location = 4) in vec3 particleScale;
layout (location = 5) in float particleLifetime;

mat4 scaleMatrix(vec3 s) {
    return mat4(
    s.x, 0, 0, 0,
    0, s.y, 0, 0,
    0, 0, s.z, 0,
    0, 0, 0, 1.0
    );
}

mat4 translationMatrix(vec3 p) {
    return mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        p.x ,p.y, p.z, 1
    );
}

out vec2 uv;

void main() {
    float scaleMultiplier = particleLifetime / 1.0f;

    gl_Position = viewMatrix * translationMatrix(particlePosition) * scaleMatrix(particleScale * scaleMultiplier) * vec4(modelPosition, 1.0);
    uv = modelUv;
}

`;

export const basicShader_frag = `#version 300 es
precision mediump float;

uniform sampler2D texture_0;

in vec2 uv;
out vec4 outColor;

const vec2 flipUV = vec2(1.0, -1.0);

void main() {
    outColor = texture(texture_0, uv * flipUV);
}
`;

export const basicShader_compute = `#version 300 es

precision highp float;

uniform float deltaTime;
uniform vec2 canvasSize;

layout (location = 0) in vec3 particlePosition;
layout (location = 1) in vec3 particleVelocity;
layout (location = 2) in vec3 particleRotation;
layout (location = 3) in vec3 particleScale;
layout (location = 4) in float particleLifetime;

out vec3 out_particlePosition;
out vec3 out_particleScale;
out float out_particleLifetime;
out vec3 out_particleVelocity;
out vec3 out_particleRotation;

void main() {
    vec3 gravityVec = vec3(0.0f, -981.0f, 0.0f) * deltaTime;
    vec3 velocity = particleVelocity + gravityVec;

    out_particleVelocity = velocity;
    out_particleScale = particleScale;
    out_particlePosition = particlePosition + (velocity * deltaTime);
    out_particleRotation = particleRotation;
    out_particleLifetime = max(particleLifetime - deltaTime, 0.0f);
}
`;
