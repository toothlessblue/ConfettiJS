import { AttributeArrayType, getAttributeTypeSize } from './attribute-array-data';

const varyingRegex = /^out (.*) (.*);$/;

function typeDefinitionToAttributeType(type: string) {
    switch (type) {
        case 'int':
            return AttributeArrayType.Int;
        case 'float':
            return AttributeArrayType.Float;
        case 'vec2':
            return AttributeArrayType.Vec2;
        case 'vec3':
            return AttributeArrayType.Vec3;
        case 'vec4':
            return AttributeArrayType.Vec4;
        case 'mat3':
            return AttributeArrayType.Mat3x3;
        case 'mat4':
            return AttributeArrayType.Mat4x4;
        default:
            throw new Error(
                `Ran into unsupported varying type definition: ${type} (if this is a valid GLSL attribute type, it should probably be implemented)`
            );
    }
}

export function getVaryingsFromComputeShader(source: string) {
    let ret: { name: string, type: string, sizeBytes: number }[] = [];

    for (let line of source.split('\n')) {
        let result = varyingRegex.exec(line);
        if (!result?.[2]) continue;
        ret.push({
            name: result[2],
            type: result[1],
            sizeBytes: getAttributeTypeSize(typeDefinitionToAttributeType(result[1])),
        });
    }

    return ret;
}
