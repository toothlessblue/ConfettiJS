export class Texture {
    private gl: WebGL2RenderingContext;
    private glTexture: WebGLTexture;
    private image: HTMLImageElement;

    constructor(gl: WebGL2RenderingContext, url: string) {
        this.gl = gl;

        this.image = new Image();
        this.image.src = url;

        this.glTexture = this.createDefiniteTexture();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

        this.image.addEventListener('load', () => {
            console.log('Loaded!');

            gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        });
    }

    private createDefiniteTexture() {
        let texture = this.gl.createTexture();

        if (!texture) {
            throw new Error('Failed to create texture!');
        }

        return texture;
    }

    private createDefiniteSampler() {
        let sampler = this.gl.createSampler();

        if (!sampler) {
            throw new Error('Failed to create sampler!');
        }

        return sampler;
    }

    bind(unit: number) {
        this.gl.activeTexture(unit + this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
    }
}         