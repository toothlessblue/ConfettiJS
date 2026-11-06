import { basicShader_dataLayout, basicShader_frag, basicShader_vert } from "./basic-shader";
import { Mesh } from "./mesh";
import { StaticQuadMesh } from "./static-quad-mesh";

export const defaultOptions = {
    shaderVert: basicShader_vert,
    shaderFrag: basicShader_frag,
    bufferLayout: basicShader_dataLayout,
    mesh: new StaticQuadMesh(),
}

export interface InitOptionsCommon {
    mesh: Mesh
}

export interface InitOptionsWithCanvas {
    canvas: HTMLCanvasElement;
}

export interface InitOptionsWithParent {
    parentElement: HTMLElement;
}

type DefaultOptions = typeof defaultOptions;
type OptionalOptions = Partial<InitOptionsWithParent & InitOptionsWithCanvas>;

export type InitOptions = InitOptionsCommon & OptionalOptions & Partial<DefaultOptions>;

export type Options = InitOptionsCommon & InitOptionsWithParent & Partial<InitOptionsWithCanvas> & DefaultOptions;
