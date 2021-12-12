import { Matrix } from "./matrix";
import { Shader } from "./shader";
import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { TextureLoader } from "./texture-loader";
import { Tile } from "./tile";
import tileImageSrc from './block.png';
import { vec } from "./vector";
import { QuadIndexBuffer } from "./quad-index-buffer";
import { VertexBuffer } from "./vertex-buffer";
import { VertexLayout } from "./vertex-layout";

const oldCanvas = document.getElementsByTagName('canvas');
for (let old of oldCanvas) {
    document.body.removeChild(old);
}

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const viewportSize = {
    width: 800,
    height: 600
}
canvas.width = viewportSize.width;
canvas.height = viewportSize.height;
const gl = canvas.getContext('webgl', {
    antialias: false,
    powerPreference: 'high-performance'
});

// hidpi scaling
function applyHiDPIScaling() {
    if (window.devicePixelRatio > 1.0) {
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        canvas.width = originalWidth * window.devicePixelRatio;
        canvas.height = originalHeight * window.devicePixelRatio;

        canvas.style.width =  originalWidth + 'px';
        canvas.style.height = originalHeight + 'px';
    }
}
applyHiDPIScaling();

TextureLoader.registerContext(gl);

// init webgl

// orthographic projection (with our world space resolution)
const ortho = Matrix.ortho(0, viewportSize.width, viewportSize.height, 0, 400, -400);
// gl vieport with the scaled resolution
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
        data[i + vertex + 1] = 1;
        vertex += size;

        data[i + vertex + 0] = 1;
        data[i + vertex + 1] = 0;
        vertex += size;

        data[i + vertex + 0] = 1;
        data[i + vertex + 1] = 1;
        vertex = 0;
    }
});
staticVertexBuffer.upload();

// quad index buffer
const quads = new QuadIndexBuffer(gl, maxTiles);

// build tiles
const image: HTMLImageElement = new Image();
let texture: WebGLTexture;
image.src = tileImageSrc;
image.decode().then(() => {
    texture = TextureLoader.load(image);
});

const tiles: Tile[] = [];
const tileXs: number[] = [];
const tileYs: number[] = [];
const tileRows = 4;
const tileColumns = 20;

const tileWidthPixels = 64;
const tileHeightPixels = 48;

// Precoumpute all the x's & y's for the tile geometry
// this keeps us from getting into trouble with floating point math 
for (let x = 0; x < (tileColumns + 1); x++) {
  tileXs[x] = x * tileWidthPixels;
}
for (let y = 0; y < (tileRows + 1); y++) {
  tileYs[y] = y * tileHeightPixels;
}

// Create tile geometry that share's the same edges
for (let x = 0; x < tileColumns; x++) {
  for (let y = 0; y < tileRows; y++) {
    const tile = new Tile({
      left: tileXs[x],
      right: tileXs[x + 1],
      top: tileYs[y],
      bottom: tileYs[y + 1]
    });
    tiles.push(tile);
  }
}

const cameraPos = vec(0, 0);

// update 
function update(ms: number) {
    cameraPos.x += (10 * (ms/1000)); // 10 pixels per second to the right
}

// draw
let vertIndex = 0;
function drawTile(tile: Tile) {
    // Quad update
    // (0, 0) - 0
    const vertices = def.buffer.bufferData;
    vertices[vertIndex++] = tile.left;
    vertices[vertIndex++] = tile.top;
        
    // (0, 1) - 1
    vertices[vertIndex++] = tile.left;
    vertices[vertIndex++] = tile.bottom;


    // (1, 0) - 2
    vertices[vertIndex++] = tile.right;
    vertices[vertIndex++] = tile.top;


    // (1, 1) - 3
    vertices[vertIndex++] = tile.right;
    vertices[vertIndex++] = tile.bottom;
}
function draw() {
    // Clear
    // Clear background
    gl.clearColor(114 / 255, 213 / 255, 224 / 255, 1.0);
    // Clear the context with the newly set color. This is
    // the function call that actually does the drawing.
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);

    // Update the tile "dynamic" geometry
    for (const tile of tiles) {
        drawTile(tile);
    }
    // Bind the shader
    shader.use();

    // Update camera uniform
    shader.addUniformFloat2('u_camera', cameraPos.x - viewportSize.width/2, cameraPos.y - viewportSize.height/2)
    
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

const mainloop = () => {
    window.requestAnimationFrame(mainloop);
    update(16);
    draw();
}
mainloop();