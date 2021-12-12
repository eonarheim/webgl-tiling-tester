import { Shader } from './shader';
import { VertexBuffer } from './vertex-buffer';
import { VertexLayout } from './vertex-layout';

export interface VertexMemoryDefinitionOptions {
    gl: WebGLRenderingContext,
    shader: Shader,
    numberOfVertices: number,
    layout: [name: string, size: number][],
    static?: boolean
}

export class VertexMemoryDefinition {
    public buffer: VertexBuffer;
    public layout: VertexLayout;
    constructor(options: VertexMemoryDefinitionOptions) {
        const vertexSize = options.layout.reduce((acc, v) => acc + v[1], 0);
        this.buffer = new VertexBuffer(options.gl, options.numberOfVertices, vertexSize, options.static);
        this.layout = new VertexLayout(options.gl, options.shader, this.buffer);
        this.layout.addVertexAttributeLayout(options.layout.map(v => v[0]));
    }
}