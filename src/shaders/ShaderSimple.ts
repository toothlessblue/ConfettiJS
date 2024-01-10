//language=GLSL
export const simple_vert = `#version 300 es

precision highp float;

uniform mat4 viewMatrix;

layout (location = 0) in vec3 position;
layout (location = 1) in mat4 translation;

out float red;

void main() {
    gl_Position = viewMatrix * translation * vec4(position, 1.0);
    //    gl_Position = translation * vec4(position, 1.0);

    red = float(gl_InstanceID + 1) / 10000.0f;
}
`;

//language=GLSL
export const simple_frag = `#version 300 es

precision highp float;

in float red;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    // Just set the output to a constant reddish-purple
    outColor = vec4(red, 0, 0.5f, 1);
}
`;