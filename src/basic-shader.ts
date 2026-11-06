import { AttributeArrayType } from './attribute-array-data';
import { MeshDataType } from './mesh';
import { BufferLayout, ShaderLayout } from './buffer-layout';

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

void main() {
    gl_Position = viewMatrix * translationMatrix(particlePosition) * scaleMatrix(particleScale) * vec4(modelPosition, 1.0);
}

`;

//language=GLSL
export const basicShader_frag = `#version 300 es
precision highp float;

out vec4 outColor;

void main() {
    outColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`;

export const basicShader_dataLayout: ShaderLayout = [
    // Mesh buffer (unchanging)
    {
        layout: [
            AttributeArrayType.Vec3, // Model position
            AttributeArrayType.Vec3, // Model normal
            AttributeArrayType.Vec2, // Model UV
        ],
        meshLayout: [MeshDataType.POSITION, MeshDataType.NORMAL, MeshDataType.UV],
    },

    // Particle data
    {
        layout: [
            AttributeArrayType.Vec3, // Particle position,
            AttributeArrayType.Vec3, // Particle velocity,
            AttributeArrayType.Vec3, // Particle euler rotation,
            AttributeArrayType.Vec3, // Particle scale,
        ],
    },
];
