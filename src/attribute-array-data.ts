export enum AttributeArrayType {
    Int,
    Float,
    Vec2,
    Vec3,
    Vec4,
    Mat3x3,
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

export function getAttributeTypeSize(type: AttributeArrayType) {
    return attributeArrayTypeToSize[type] ?? -1;
}
