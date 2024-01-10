let canvas: HTMLCanvasElement = document.createElement('canvas');

export function spawnCanvas(): WebGL2RenderingContext {
    canvas.id = '_' + crypto.randomUUID();

    let canvasStyles = new CSSStyleSheet();

    //language=css
    canvasStyles.replaceSync(`
        #${canvas.id} {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
        }
    `);

    document.adoptedStyleSheets.push(canvasStyles);
    document.body.appendChild(canvas);

    let context = canvas.getContext('webgl2', {
        antialias: true,
    });

    if (!context) {
        throw new Error('Unable to get webgl2 canvas context');
    }

    resizeCanvasToDisplaySize(canvas);

    return context;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    let displayWidth = canvas.clientWidth;
    let displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    let needResize = canvas.width !== displayWidth ||
        canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}