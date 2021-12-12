import { Shader } from './shader';
import { VertexBuffer } from './vertex-buffer';

export interface VertexAttributeDefinition {
    name: string;
    size: number;
    glType: number;
    normalized: boolean;
    location: number;
}

export class VertexLayout {
    private _gl: WebGLRenderingContext;
    private _vertexBuffer: VertexBuffer;
    private _shader: Shader;
    private _layout: VertexAttributeDefinition[] = [];
    constructor(gl: WebGLRenderingContext, shader: Shader, vertexBuffer: VertexBuffer) {
        this._gl = gl;
        this._vertexBuffer = vertexBuffer;
        this._shader = shader;
    }
    /**
     * Total number of bytes that the vertex will take up
     */
     public get totalVertexSizeBytes(): number {
        let vertexSize = 0;
        for (const vert of this._layout) {
          let typeSize = 1;
          switch (vert.glType) {
            case this._gl.FLOAT: {
              typeSize = 4;
              break;
            }
            case this._gl.SHORT: {
              typeSize = 2;
              break;
            }
            default: {
              typeSize = 1;
            }
          }
          vertexSize += typeSize * vert.size;
        }
    
        return vertexSize;
      }

    addVertexAttributeLayout(attributes: string[]) {
        const shaderAttributes = this._shader.attributes;
        for (let attribute of attributes) {
            const attrib = shaderAttributes[attribute];
            if (!attrib) throw Error(attribute + ' not found in the shader source');
            this._layout.push(attrib);
        }
    }

    bind() {
        this._vertexBuffer.bind();
        const gl = this._gl;
        let offset = 0;
        for (const vert of this._layout) {
            gl.vertexAttribPointer(vert.location, vert.size, vert.glType, vert.normalized, this.totalVertexSizeBytes, offset);
            gl.enableVertexAttribArray(vert.location);
            offset += this._shader.getAttributeSize(vert.name);
        }
    }
}