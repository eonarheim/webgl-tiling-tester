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
import * as solution1 from './solution1';
import * as solution2 from './solution2';
import { TransformStack } from "./transform-stack";

let useUVBodge = true;
let useUnecessaryScaling = true;
let useTransformCamera = true;
let useSharedTileEdge = false;


const canvas = document.getElementById('game') as HTMLCanvasElement;
const viewportSize = {
    width: 800,
    height: 600
}
canvas.width = viewportSize.width;
canvas.height = viewportSize.height;
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
        canvas.width = viewportSize.width * window.devicePixelRatio;
        canvas.height = viewportSize.height * window.devicePixelRatio;

        canvas.style.width =  viewportSize.width + 'px';
        canvas.style.height = viewportSize.height + 'px';
    }
    console.log('pixel ratio', window.devicePixelRatio);
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

const transform = new TransformStack();

// orthographic projection (with our world space resolution)
let ortho = Matrix.ortho(0, viewportSize.width, viewportSize.height, 0, 400, -400);
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
const shader = new Shader(vertexSrc, fragmentSrc);
shader.compile(gl);

shader.addUniformMatrix('u_matrix', ortho.data);

const maxTiles = 200;

// vertex definiton 
const def = shader.createVertexMemoryDefinition({
    numberOfVertices: maxTiles * 4,
    layout: [
        [ 'a_position', 2 ]
    ],
    static: false
});

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

// quad index buffer
const quads = new QuadIndexBuffer(gl, maxTiles);

// load image
const image: HTMLImageElement = new Image();
let texture: WebGLTexture;
image.src = tileImageSrc;
image.decode().then(() => {
    texture = TextureLoader.load(image);
});



// build tiles
let tiles: Tile[];
if (useSharedTileEdge) {
    tiles = solution2.generateTiles(4, 20, tileWidthPixels, tileHeightPixels);
} else {
    tiles = broken.generateTiles(4, 20, tileWidthPixels, tileHeightPixels);
}

const cameraPos = vec(0, 0);
(window as any).cameraPos = cameraPos;
cameraPos.y = 201.00000000000023; // seems to produce the artifact for me on a 1920x1080 screen
cameraPos.x = 89.5196762084961;
// update 
function update(ms: number) {
    cameraPos.x += (10 * (ms/1000)); // 10 pixels per second to the right
    // cameraPos.y += (.05 * (ms/1000));
}

// draw
let vertIndex = 0;
function drawTile(tile: Tile) {
    // Quad update
    let topLeft = vec(tile.left, tile.top);
    let bottomRight = vec(tile.right, tile.bottom);
    topLeft = transform.current.multv(topLeft);
    bottomRight = transform.current.multv(bottomRight);

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
    // Clear
    // Clear background
    gl.clearColor(114 / 255, 213 / 255, 224 / 255, 1.0);
    // Clear the context with the newly set color. This is
    // the function call that actually does the drawing.
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);

    transform.save();
    if (useTransformCamera) {
        transform.translate(-cameraPos.x + viewportSize.width/2, -cameraPos.y + viewportSize.height/2);
    }
    // move tilemap to 100,300
    transform.translate(100, 300);
    // Update the tile "dynamic" geometry
    for (const tile of tiles) {
        drawTile(tile);
    }
    transform.restore();

    // Bind the shader
    shader.use();

    // Update camera uniform
    if (useTransformCamera) {
        shader.addUniformFloat2('u_camera', 0, 0);
    } else {
        shader.addUniformFloat2('u_camera', cameraPos.x - viewportSize.width/2, cameraPos.y - viewportSize.height/2);
    }

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