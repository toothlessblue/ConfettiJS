import { AttributeArrayType, getAttributeTypeSize } from './attribute-array-data';
import { DataLayout } from './buffer-layout';

const layoutRegex = /layout \(location = (?<locationString>[0-9]*)\) in (?<typeString>.*) (?<name>.*);/g;
const varyingRegex = /^out (.*) (.*);$/;

/**
 * Maps a GLSL type string to its corresponding `AttributeArrayType`.
 * @param type - The GLSL type string.
 * @returns The corresponding `AttributeArrayType`.
 * @throws Error if the type is unsupported.
 */
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

/**
 * Information about a varying variable in a shader.
 */
export interface VaryingInfo {
    /** The name of the varying. */
    name: string;
    /** The type of the varying. */
    type: string;
    /** The size of the varying in bytes. */
    sizeBytes: number;
}

/**
 * Extracts varyings from a compute shader source string.
 * @param source - The compute shader source.
 * @returns An array of `VaryingInfo` objects.
 */
export function getVaryingsFromComputeShader(source: string) {
    let ret: VaryingInfo[] = [];

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

/**
 * Parses a shader source string to determine its buffer layout.
 * @param source - The shader source string.
 * @returns The parsed `DataLayout`.
 * @throws Error if a location is reused within the shader source.
 */
export function parseShaderForBufferLayout(source: string) {
    let meshKeynames = ['modelPosition', 'modelNormal', 'modelUv'];

    let layout: DataLayout = {
        mesh: [],
        particle: [],
    };

    let seenLocations = new Set<number>();

    for (let match of source.matchAll(layoutRegex)) {
        if (!match.groups) continue;

        let { locationString, typeString, name } = match.groups;

        let location = parseInt(locationString);
        if (seenLocations.has(location)) {
            throw new Error(`Location ${location} appears more than once within shader source!`);
        }
        seenLocations.add(location);

        let type = typeDefinitionToAttributeType(typeString);

        if (meshKeynames.includes(name)) {
            layout.mesh.push({ type, location, name });
        } else {
            layout.particle.push({ type, location, name });
        }
    }

    return layout;
}
