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
        antialias: false,
        depth: false,
        desynchronized: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
    });

    if (!context) {
        throw new Error('Unable to get webgl2 canvas context');
    }

    resizeCanvasToDisplaySize(canvas);

    return context;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, ratio: number = 1) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    let displayWidth = Math.floor(canvas.clientWidth * ratio);
    let displayHeight = Math.floor(canvas.clientHeight * ratio);

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