import { Matrix } from "./matrix";
import { Shader } from "./shader";
import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { ensurePowerOfTwo, TextureLoader } from "./texture-loader";
import { Tile } from "./tile";
import tileImageSrc from './block.png';
import { vec } from "./vector";
import { QuadIndexBuffer } from "./quad-index-buffer";
import { VertexBuffer } from "./vertex-buffer";
import { VertexLayout } from "./vertex-layout";

import * as broken from './broken';
import * as solutionSharedEdge from './solution-shared-edge';
import { TransformStack } from "./transform-stack";
import { VertexMemoryDefinition } from "./vertex-definition";
import { nudgeToScreenPixelCeil, nudgeToScreenPixelFloor } from "./pixel-nudge";

// Flags
let useUVBodge = false;
let useScrollX = false;
let useScrollY = false;
let useUnecessaryScaling = false;
let useTruncate = false;
let useSharedTileEdge = false;
let usePixelToScreenNudge = false;


const pixelRatio$ = document.getElementById('current-pixel-ratio');

const reset$ = document.getElementById('reset');
reset$.addEventListener('click', () => {
    init();
});

const scrollX$ = document.getElementById('scroll-x');
useScrollX = !!(scrollX$ as any).checked;
scrollX$.addEventListener('change', (e) => {
    useScrollX = (e.target as any).checked;
});

const scrollY$ = document.getElementById('scroll-y');
useScrollY = !!(scrollY$ as any).checked;
scrollY$.addEventListener('change', (e) => {
    useScrollY = (e.target as any).checked;
});

const uvBodge$ = document.getElementById('uv-bodge');
useUVBodge = !!(uvBodge$ as any).checked;
uvBodge$.addEventListener('change', (e) => {
    useUVBodge = (e.target as any).checked;
    init();
});

const truncate$ = document.getElementById('truncate');
useTruncate = !!(truncate$ as any).checked;
truncate$.addEventListener('change', (e) => {
    useTruncate = (e.target as any).checked;
    init();
});

const unecessaryScaling$ = document.getElementById('unnecessary-geometry-scaling');
useUnecessaryScaling = !!(unecessaryScaling$ as any).checked;
unecessaryScaling$.addEventListener('change', (e) => {
    useUnecessaryScaling = (e.target as any).checked;
    init();
});


const pixelToScreenNudge$ = document.getElementById('pixel-to-screen-nudge');
usePixelToScreenNudge = !!(pixelToScreenNudge$ as any).checked;
pixelToScreenNudge$.addEventListener('change', (e) => {
    usePixelToScreenNudge = (e.target as any).checked;
    init();
});

const sharedTileEdge$ = document.getElementById('shared-tile-edge');
useSharedTileEdge = !!(sharedTileEdge$ as any).checked;
sharedTileEdge$.addEventListener('change', (e) => {
    useSharedTileEdge = (e.target as any).checked;
    init();
});


const canvas = document.getElementById('game') as HTMLCanvasElement;
const resolution = {
    width: 800,
    height: 600
}
canvas.width = resolution.width;
canvas.height = resolution.height;
canvas.style.imageRendering = 'pixelated';
// Fall back to 'crisp-edges' if 'pixelated' is not supported
// Currently for firefox https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
if (canvas.style.imageRendering === '') {
    canvas.style.imageRendering = 'crisp-edges';
}
const gl = canvas.getContext('webgl', {
    antialias: false,
    powerPreference: 'high-performance'
});

// hidpi scaling
function applyHiDPIScaling() {
    if (window.devicePixelRatio > 1.0) {
        canvas.width = resolution.width * window.devicePixelRatio;
        canvas.height = resolution.height * window.devicePixelRatio;

        canvas.style.width =  resolution.width + 'px';
        canvas.style.height = resolution.height + 'px';
    }
    console.log('pixel ratio', window.devicePixelRatio);
    pixelRatio$.innerText = window.devicePixelRatio.toString();
}
applyHiDPIScaling();


function listenForPixelRatioChange() {
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', pixelRatioChangeHandler, {once: true}); // doesn't work in safari
}

function pixelRatioChangeHandler() {
    listenForPixelRatioChange();
    applyHiDPIScaling();
}

listenForPixelRatioChange();

TextureLoader.registerContext(gl);

// init webgl
const tileWidthPixels = 64;
const tilePOTWidth = ensurePowerOfTwo(tileWidthPixels);
const tileHeightPixels = 48;
const tilePOTHeight = ensurePowerOfTwo(tileHeightPixels);
const maxTiles = 200;

let tiles: Tile[];

let shader: Shader;
let def: VertexMemoryDefinition;

// quad index buffer
const quads = new QuadIndexBuffer(gl, maxTiles);

// load image
const image: HTMLImageElement = new Image();
let texture: WebGLTexture;
image.src = tileImageSrc;
image.decode().then(() => {
    texture = TextureLoader.load(image);
});

let transform: TransformStack;

const cameraPos = vec(0, 0);
(window as any).cameraPos = cameraPos;


function init() {
    transform = new TransformStack();
    // orthographic projection (with our world space resolution)
    let ortho = Matrix.ortho(0, resolution.width, resolution.height, 0, 400, -400);
    if (useUnecessaryScaling) {
        transform.current = Matrix.identity();
        ortho = Matrix.ortho(0, canvas.width, canvas.height, 0, 400, -400);
        transform.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // gl vieport with the scaled resolution (draw buffer)
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Disable depth test
    gl.disable(gl.DEPTH_TEST);

    // Clear background
    gl.clearColor(114 / 255, 213 / 255, 224 / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable alpha blending 
    gl.enable(gl.BLEND);
    // Premultiplied alpha)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // build shader
    shader = new Shader(vertexSrc, fragmentSrc);
    shader.compile(gl);

    shader.addUniformMatrix('u_matrix', ortho.data);

    // vertex definiton 
    def = shader.createVertexMemoryDefinition({
        numberOfVertices: maxTiles * 4,
        layout: [
            [ 'a_position', 2 ]
        ],
        static: false
    });

    // Static quad UV coordinates
    const staticVertexBuffer = new VertexBuffer(gl, maxTiles * 4, 2, true);
    const staticVertexLayout = new VertexLayout(gl, shader, staticVertexBuffer);
    staticVertexLayout.addVertexAttributeLayout([
        'a_texcoord'
    ]);
    shader.addVertexLayout(staticVertexLayout);
    staticVertexBuffer.fill((data, num, size) => {
        let vertex = 0;
        for (let i = 0; i < num; i += (size * 4)) {
            data[i + vertex + 0] = 0;
            data[i + vertex + 1] = 0;
            vertex += size;

            data[i + vertex + 0] = 0;
            data[i + vertex + 1] = (tileHeightPixels - (useUVBodge ? 0.01 : 0))/ tilePOTHeight;
            vertex += size;

            data[i + vertex + 0] = (tileWidthPixels  - (useUVBodge ? 0.01 : 0)) / tilePOTWidth;
            data[i + vertex + 1] = 0;
            vertex += size;

            data[i + vertex + 0] = (tileWidthPixels - (useUVBodge ? 0.01 : 0)) / tilePOTWidth;
            data[i + vertex + 1] = (tileHeightPixels - (useUVBodge ? 0.01 : 0)) / tilePOTHeight;
            vertex = 0;
        }
    });
    staticVertexBuffer.upload();

    // build tiles
    if (useSharedTileEdge) {
        tiles = solutionSharedEdge.generateTiles(4, 20, tileWidthPixels, tileHeightPixels);
    } else {
        tiles = broken.generateTiles(4, 20, tileWidthPixels, tileHeightPixels);
    }

    // seems to produce the artifact for me on a 1920x1080 screen
    cameraPos.y = 201.00000000000023;
    cameraPos.x = 89.5196762084961;
    // cameraPos.x = 0;
    // cameraPos.y = 0;
}
init();

// update 
function update(ms: number) {
    if (useScrollX) {
        cameraPos.x += (3 * (ms/1000)); // 10 pixels per second to the right
    }
    if (useScrollY) {
        cameraPos.y += (.1 * (ms/1000));
    }
}

// draw
let vertIndex = 0;
function drawTile(tile: Tile) {
    // Quad update
    let topLeft = vec(useTruncate ? ~~tile.left : tile.left, useTruncate ? ~~tile.top : tile.top);
    let bottomRight = vec(useTruncate ? ~~tile.right : tile.right, useTruncate ? ~~tile.bottom : tile.bottom);

    if (useSharedTileEdge) {
        // transform at the last minute
        topLeft = transform.current.multv(topLeft);
        bottomRight = transform.current.multv(bottomRight);
    }

    if (useTruncate) {
        topLeft.x = ~~topLeft.x
        topLeft.y = ~~topLeft.y
        bottomRight.x = ~~bottomRight.x
        bottomRight.y = ~~bottomRight.y
    }

    if (usePixelToScreenNudge) {
        topLeft = nudgeToScreenPixelFloor(transform.current, topLeft, resolution);
        bottomRight = nudgeToScreenPixelCeil(transform.current, bottomRight, resolution);
    }

    // (0, 0) - 0
    const vertices = def.buffer.bufferData;
    vertices[vertIndex++] = topLeft.x;
    vertices[vertIndex++] = topLeft.y;

    // (0, 1) - 1
    vertices[vertIndex++] = topLeft.x;
    vertices[vertIndex++] = bottomRight.y;


    // (1, 0) - 2
    vertices[vertIndex++] = bottomRight.x;
    vertices[vertIndex++] = topLeft.y;


    // (1, 1) - 3
    vertices[vertIndex++] = bottomRight.x;
    vertices[vertIndex++] = bottomRight.y;
}

function draw() {
    // Clear the context with the newly set color. This is
    // the function call that actually does the drawing.
    gl.clearColor(114 / 255, 213 / 255, 224 / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);

    transform.save();
    // Apply Camera transform
    let finalPos = vec(-cameraPos.x + resolution.width/2, -cameraPos.y + resolution.height/2)
    if (useTruncate) {
        finalPos.x = ~~finalPos.x;
        finalPos.y = ~~finalPos.y;
    }
    transform.translate(finalPos.x, finalPos.y);

    // Draw scene
    transform.save();
    // Move tilemap to 100,300
    transform.translate(100, 300);

    // build tiles
    if (useSharedTileEdge) {
        tiles = solutionSharedEdge.generateTiles(4, 20, tileWidthPixels, tileHeightPixels);
    } else {
        tiles = broken.generateTiles2(transform, 4, 20, tileWidthPixels, tileHeightPixels);
    }

    // Update the tile "dynamic" geometry
    for (const tile of tiles) {
        drawTile(tile);
    }
    transform.restore();
    transform.restore();

    // Bind the shader
    shader.use();

    // Bind textures uniform
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Upload "dynamic" geometry
    def.buffer.upload();

    // Use quad index buffer that defines the shapes
    quads.bind();

    // Draw all the quads (tiles * indexed verts)
    gl.drawElements(gl.TRIANGLES, tiles.length * 6, quads.gltype, 0);

    // reset vert index
    vertIndex = 0;
}

let last = performance.now();
const mainloop = (now: number) => {
    let elapsed = now - last;
    if (elapsed > 200) {
        elapsed = 1;
    }
    window.requestAnimationFrame(mainloop);
    update(elapsed);
    draw();
    last = now;
}
mainloop(last - 16);