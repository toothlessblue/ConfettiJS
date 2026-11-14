import { basicShader_compute, basicShader_frag, basicShader_vert } from './basic-shader';
import { StaticQuadMesh } from './static-quad-mesh';

export const defaultOptions = {
    shaderVert: basicShader_vert,
    shaderFrag: basicShader_frag,
    shaderCompute: basicShader_compute,
    mesh: new StaticQuadMesh(),
    manualResizeHandling: false,
};
type DefaultOptions = typeof defaultOptions;

export interface InitOptionsCommon {
    fullscreen?: boolean;

    // If defined, don't calculate the deltaTime between frames, always assume it to be this value
    // Keep in mind that modifying this value will change the animation speed of shaders that make use
    //  of the deltaTime uniform.
    assumeFrameTime?: number | false;
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
