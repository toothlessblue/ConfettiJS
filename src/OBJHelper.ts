type Vector3 = [number, number, number];
type Vector2 = [number, number];
type Face = [number, number, number];

type OperatorFunction = (data: string, elements: OBJElements) => void;

export interface OBJElements {
    vertices: Vector3[];
    uv: Vector2[];
    normals: Vector3[];
    faces: Face[]; // indexes in the order => [vertex, UV, normal]
}

function parseVector3(data: string): Vector3 {
    let segments = data.split(' ');

    return [
        parseFloat(segments[0]),
        parseFloat(segments[1]),
        parseFloat(segments[2]),
    ];
}

function parseVector2(data: string): Vector2 {
    let segments = data.split(' ');

    return [
        parseFloat(segments[0]),
        parseFloat(segments[1]),
    ];
}

function parseFace(data: string): Face {
    let segments = data.split('/');

    return [
        parseFloat(segments[0]),
        parseFloat(segments[1]),
        parseFloat(segments[2]),
    ];
}

const objFunctions: Record<string, OperatorFunction> = {
    'v': (data: string, elements: OBJElements) => {
        let vector = parseVector3(data);
        elements.vertices.push(vector);
    },
    'vn': (data: string, elements: OBJElements) => {
        let vector = parseVector3(data);
        elements.normals.push(vector);
    },
    'vt': (data: string, elements: OBJElements) => {
        let vector = parseVector2(data);
        elements.uv.push(vector);
    },
    'f': (data: string, elements: OBJElements) => {
        let faces = data.split(' ').map(_ => parseFace(_));
        elements.faces.push(...faces);
    },
};

function parseLine(line: string, elements: OBJElements) {
    let firstSpace = line.indexOf(' ');
    let command = line.substring(0, firstSpace);
    let data = line.substring(firstSpace + 1);

    let operator = objFunctions[command];
    if (!operator) return;
    operator(data, elements);
}

export function parseOBJ(source: string) {
    let lines = source.split('\n');

    let elements: OBJElements = {
        vertices: [],
        uv: [],
        normals: [],
        faces: [],
    };

    for (let line of lines) {
        parseLine(line, elements);
    }

    return elements;
}