//language=GLSL

export const particlePhysics_vert = `#version 300 es

precision highp float;

uniform vec2 canvasSize;

layout (location = 0) in mat4 in_translation;
layout (location = 4) in vec4 in_scale;
layout (location = 5) in vec4 in_velocity;
layout (location = 6) in vec4 in_rotationalVelocity;

out mat4 out_translation;
out vec4 out_scale;
out vec4 out_velocity;
out vec4 out_rotationalVelocity;

mat4 translationMat4(vec4 vec) {
    return mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    vec.x, vec.y, vec.z, 1
    );
}

mat4 eulerMatrix(vec4 vec) {
    float sa = sin(vec.x);
    float ca = cos(vec.x);
    float sb = sin(vec.z);
    float cb = cos(vec.z);
    float sh = sin(vec.y);
    float ch = cos(vec.y);

    return mat4(
    ch * ca, sa, -sh * ca, 0.0f,
    ((-ch) * sa * cb) + (sh * sb), ca * cb, (sh * sa * cb) + (ch * sb), 0,
    (ch * sa * sb) + (sh * cb), (-ca) * sb, (-sh * sa * sb) + (ch * cb), 0,
    0.0f, 0.0f, 0.0f, 1.0f
    );
}

mat4 pullRotation(mat4 i) {
    return mat4(
    i[0][0], i[0][1], i[0][2], i[0][3],
    i[1][0], i[1][1], i[1][2], i[1][3],
    i[2][0], i[2][1], i[2][2], i[2][3],
    0.0f, 0.0f, 0.0f, i[3][3]
    );
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 relativeUp = normalize(vec4(0.0f, 0.0f, -1.0f, 1.0f) * pullRotation(in_translation)).xyz;

    vec4 gravityVec = vec4(0.0f, -0.35f, 0.0f, 0.0f);

    vec4 upVelocityDot = mix(vec4(cross(relativeUp, in_velocity.xyz), 0.0f), in_velocity, 0.9f);

    mat4 translation = in_translation;
    vec4 velocity = upVelocityDot + gravityVec;

    out_velocity = velocity;
    out_scale = in_scale;
    out_translation = translationMat4(velocity) * translation * eulerMatrix(in_rotationalVelocity);
    out_rotationalVelocity = in_rotationalVelocity;
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