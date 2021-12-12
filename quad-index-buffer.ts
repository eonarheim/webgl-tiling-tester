
export class QuadIndexBuffer {
    public buffer: WebGLBuffer;
    public bufferData: Uint16Array | Uint32Array;
    private _gl: WebGLRenderingContext;
    public gltype: number;
    constructor(gl: WebGLRenderingContext, numberOfQuads: number) {
        this._gl = gl;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        this.gltype =gl.UNSIGNED_SHORT
        const ext = gl.getExtension('OES_element_index_uint');
        if (ext) {
            // fall back to using gl.UNSIGNED_SHORT or tell the user they are out of luck
            this.gltype = gl.UNSIGNED_INT;
        }

        const total = numberOfQuads * 6;
        this.bufferData = new Uint32Array(total);

        let currentQuad = 0;
        for (let i = 0; i < total; i += 6) {
            // first triangle
            this.bufferData[i + 0] = currentQuad + 0;
            this.bufferData[i + 1] = currentQuad + 1;
            this.bufferData[i + 2] = currentQuad + 2;
            // second triangle
            this.bufferData[i + 3] = currentQuad + 2;
            this.bufferData[i + 4] = currentQuad + 1;
            this.bufferData[i + 5] = currentQuad + 3;
            currentQuad += 4;
        }
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.bufferData), gl.STATIC_DRAW);
    }

    public size() {
        return this.bufferData.length;
    }

    public bind() {
        const gl = this._gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
    }
}
