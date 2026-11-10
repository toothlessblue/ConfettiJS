import { basicShader_compute, basicShader_frag, basicShader_vert } from "./basic-shader";
import { StaticQuadMesh } from "./static-quad-mesh";

export const defaultOptions = {
    shaderVert: basicShader_vert,
    shaderFrag: basicShader_frag,
    shaderCompute: basicShader_compute,
    mesh: new StaticQuadMesh(),
    manualResizeHandling: false,
}
type DefaultOptions = typeof defaultOptions;

export interface InitOptionsCommon {
    fullscreen?: boolean,
}

export interface InitOptionsWithCanvas {
    canvas: HTMLCanvasElement;
}

export interface InitOptionsWithParent {
    parentElement: HTMLElement;
}

type OptionalOptions = Partial<InitOptionsWithParent & InitOptionsWithCanvas>;

export type InitOptions = InitOptionsCommon & OptionalOptions & Partial<DefaultOptions>;

export type Options = InitOptionsCommon & InitOptionsWithParent & Partial<InitOptionsWithCanvas> & DefaultOptions;
