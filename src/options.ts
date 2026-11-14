import { basicShader_compute, basicShader_frag, basicShader_vert } from './basic-shader';
import { StaticQuadMesh } from './static-quad-mesh';

/**
 * Default configuration options for the ConfettiJS library.
 */
export const defaultOptions = {
    shaderVert: basicShader_vert,
    shaderFrag: basicShader_frag,
    shaderCompute: basicShader_compute,
    mesh: new StaticQuadMesh(),
    manualResizeHandling: false,
};
/**
 * Type representation of the default configuration options.
 */
type DefaultOptions = typeof defaultOptions;

/**
 * Common options shared across different initialization methods.
 */
export interface InitOptionsCommon {
    fullscreen?: boolean;

    // If defined, don't calculate the deltaTime between frames, always assume it to be this value
    // Keep in mind that modifying this value will change the animation speed of shaders that make use
    //  of the deltaTime uniform.
    assumeFrameTime?: number | false;
}

/**
 * Options for initialization when a canvas element is provided directly.
 */
export interface InitOptionsWithCanvas {
    canvas: HTMLCanvasElement;
}

/**
 * Options for initialization when a parent element is provided for canvas creation.
 */
export interface InitOptionsWithParent {
    parentElement: HTMLElement;
}

type OptionalOptions = Partial<InitOptionsWithParent & InitOptionsWithCanvas>;

/**
 * Options for initialization when the user provides either a parent element or a canvas,
 * merged with partial default options.
 */
export type InitOptions = InitOptionsCommon & OptionalOptions & Partial<DefaultOptions>;

/**
 * Full configuration object for the library, combining all initialization options
 * and default values.
 */
export type Options = InitOptionsCommon & InitOptionsWithParent & Partial<InitOptionsWithCanvas> & DefaultOptions;
