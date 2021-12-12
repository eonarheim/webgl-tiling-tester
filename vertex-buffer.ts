export class VertexBuffer {
    public buffer: WebGLBuffer;
    public bufferData: Float32Array;
    private _gl: WebGLRenderingContext;
    sizePerVertex: number;
    numberOfVertices: number;
    isStatic: boolean;
    constructor(gl: WebGLRenderingContext, numberOfVertices: number, sizePerVertex: number, isStatic = false) {
        this._gl = gl;
        const total = numberOfVertices * sizePerVertex;
        this.buffer = gl.createBuffer();
        this.numberOfVertices = numberOfVertices;
        this.sizePerVertex = sizePerVertex;
        this.isStatic = isStatic;
        this.bufferData = new Float32Array(total);
    }

    fill(filler: (data: Float32Array, numberOfVertices: number, sizePerVertex: number) => any) {
        filler(this.bufferData, this.numberOfVertices, this.sizePerVertex);
    }

    bind() {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    }

    upload() {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, this.isStatic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
    }
}