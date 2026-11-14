/**
 * Types of attribute arrays in a buffer.
 */
export enum AttributeArrayType {
    /** Integer. */
    Int,
    /** Floating-point. */
    Float,
    /** 2D Vector. */
    Vec2,
    /** 3D Vector. */
    Vec3,
    /** 4D Vector. */
    Vec4,
    /** 3x3 Matrix. */
    Mat3x3,
    /** 4x4 Matrix. */
    Mat4x4,
}

const attributeArrayTypeToSize = {
    [AttributeArrayType.Int]: 1,
    [AttributeArrayType.Float]: 1,
    [AttributeArrayType.Vec2]: 2,
    [AttributeArrayType.Vec3]: 3,
    [AttributeArrayType.Vec4]: 4,
    [AttributeArrayType.Mat3x3]: 9,
    [AttributeArrayType.Mat4x4]: 16,
};

/**
 * Converts an `AttributeArrayType` enum value to its corresponding string representation.
 * @param type - The type of the attribute array.
 * @returns The string representation of the type.
 */
export function attributeArrayTypeToString(type: AttributeArrayType) {
    switch (type) {
        case AttributeArrayType.Int:
            return 'Int'
        case AttributeArrayType.Float:
            return 'Float'
        case AttributeArrayType.Vec2:
            return 'Vec2';
        case AttributeArrayType.Vec3:
            return 'Vec3';
        case AttributeArrayType.Vec4:
            return 'Vec4';
        case AttributeArrayType.Mat3x3:
            return 'Mat3x3';
        case AttributeArrayType.Mat4x4:
            return 'Mat4x4';
        default:
            return 'Unknown'
    }
}

/**
 * Returns the number of elements in an attribute of the specified type.
 * @param type - The type of the attribute.
 * @returns The number of elements.
 */
export function getAttributeTypeSize(type: AttributeArrayType) {
    return attributeArrayTypeToSize[type] ?? -1;
}
