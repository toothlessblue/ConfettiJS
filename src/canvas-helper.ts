import { Options } from './options';

function createCanvasAndAddToDOM(parent: HTMLElement): HTMLCanvasElement {
    let canvas = document.createElement('canvas');
    parent.appendChild(canvas);
    return canvas;
}

export function initCanvas(options: Options, resizeCallback: (width: number, height: number) => void) {
    let parent = options.parentElement;
    let canvas = options.canvas ?? createCanvasAndAddToDOM(parent);
    canvas.id ||= 'confetti-canvas-' + crypto.randomUUID(); // crypto uuids sometimes start with numbers, which is invalid for a CSS ID, lol

    // Default height/width for when manualResizeHandling is true
    let targetWidth = 512;
    let targetHeight = 512;

    if (!options.manualResizeHandling) {
        let resizeObserver = new ResizeObserver((entries) => {
            // This observer should only ever be observing 1 element (either body or the canvas parent)
            resizeCallback(entries[0].contentRect.width, entries[0].contentRect.height);
        });

        let resizeTarget: HTMLElement;

        if (options.fullscreen) {
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
            resizeTarget = document.body;
        } else {
            resizeTarget = canvas.parentElement!;
        }

        resizeObserver.observe(resizeTarget);
        targetWidth = resizeTarget.clientWidth;
        targetHeight = resizeTarget.clientHeight;
    }

    requestAnimationFrame(() => {
        resizeCallback(targetWidth, targetHeight);
    })

    return canvas;
}


