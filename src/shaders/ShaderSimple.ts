//language=GLSL
export const simple_vert = `#version 300 es

precision highp float;

uniform mat4 viewMatrix;

layout (location = 0) in mat4 translation;
layout (location = 4) in vec4 scale;

layout (location = 5) in vec3 position;
layout (location = 6) in vec2 vertexUV;

mat4 pullRotation(mat4 i) {
    return mat4(
    i[0][0], i[0][1], i[0][2], i[0][3],
    i[1][0], i[1][1], i[1][2], i[1][3],
    i[2][0], i[2][1], i[2][2], i[2][3],
    0.0f, 0.0f, 0.0f, i[3][3]
    );
}

mat4 scaleMatrix(vec4 s) {
    return mat4(
    s.x, 0, 0, 0,
    0, s.y, 0, 0,
    0, 0, s.z, 0,
    0, 0, 0, s.w
    );
}

out vec2 UV;
out vec4 normal;
out float cosTheta;
out mat4 rotation;

void main() {
    rotation = pullRotation(translation);

    UV = vertexUV;

    cosTheta = abs(clamp(dot(normal, vec4(0, 0, 1, 0)), -1.0f, 1.0f));

    gl_Position = viewMatrix * translation * scaleMatrix(scale) * vec4(position, 1.0);
}
`;

//language=GLSL
export const simple_frag = `#version 300 es

precision highp float;

uniform vec4 lightColour;

in vec2 UV;
in mat4 rotation;

out vec4 outColor;

uniform sampler2D normalMap;

void main() {
    vec4 colour = vec4(
    0.5176470588235295f,
    0.7294117647058823f,
    0.13333333333333333f,
    1.0f);

    vec2 normalisedUV = vec2(1.0f) - (UV * 2.0f) - vec2(1.0f);

    vec4 normal = normalize(texture(normalMap, UV) * vec4(2.0f, 2.0f, 1.0f, 1.0f)) * 2.0f;
    normal = normalize(mix(vec4(normalisedUV.x, normalisedUV.y, 0, 0), normal, 0.75f));
    normal = rotation * normal;

    float cosTheta = abs(clamp(dot(normal, vec4(0, 0, 1, 0)), -1.0f, 1.0f));

    outColor = mix(colour, lightColour, pow(cosTheta, 2.0f));
}
`;