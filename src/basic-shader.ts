//language=GLSL
export const basicShader_vert = `#version 300 es
precision highp float;

uniform mat4 viewMatrix;

layout (location = 0) in vec3 modelPosition;
layout (location = 1) in vec3 modelNormal;
layout (location = 2) in vec2 modelUv;

layout (location = 3) in vec3 particlePosition;
layout (location = 4) in vec3 particleVelocity;
layout (location = 5) in vec3 particleRotation;
layout (location = 6) in vec3 particleScale;
layout (location = 7) in float particleLifetime;

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

//language=GLSL
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

//language=GLSL
export const basicShader_compute = `#version 300 es

precision highp float;

uniform float deltaTime;
uniform vec2 canvasSize;

layout (location = 0) in vec3 in_position;
layout (location = 1) in vec3 in_velocity;
layout (location = 2) in vec3 in_rotation;
layout (location = 3) in vec3 in_scale;
layout (location = 4) in float in_lifetime;

out vec3 out_position;
out vec3 out_velocity;
out vec3 out_rotation;
out vec3 out_scale;
out float out_lifetime;

void main() {
    vec3 gravityVec = vec3(0.0f, -981.0f, 0.0f) * deltaTime;
    vec3 velocity = in_velocity + gravityVec;

    out_velocity = velocity;
    out_scale = in_scale;
    out_position = in_position + (velocity * deltaTime);
    out_rotation = in_rotation;
    out_lifetime = max(in_lifetime - deltaTime, 0.0f);
}
`;
