export class Matrix {
    /**
     *  4x4 matrix in column major order
     *
     * |         |         |          |          |
     * | ------- | ------- | -------- |          |
     * | data[0] | data[4] | data[8]  | data[12] |
     * | data[1] | data[5] | data[9]  | data[13] |
     * | data[2] | data[6] | data[10] | data[14] |
     * | data[3] | data[7] | data[11] | data[15] |
     *
     */
    data = new Float32Array(16);
  
    /**
     * Creates an orthographic (flat non-perspective) projection
     * https://en.wikipedia.org/wiki/Orthographic_projection
     * @param {number} left
     * @param {number} right
     * @param {number} bottom
     * @param {number} top
     * @param {number} near
     * @param {number} far
     * @returns Matrix
     */
    static ortho(left, right, bottom, top, near, far) {
      const mat = new Matrix();
      mat.data[0] = 2 / (right - left);
      mat.data[1] = 0;
      mat.data[2] = 0;
      mat.data[3] = 0;
  
      mat.data[4] = 0;
      mat.data[5] = 2 / (top - bottom);
      mat.data[6] = 0;
      mat.data[7] = 0;
  
      mat.data[8] = 0;
      mat.data[9] = 0;
      mat.data[10] = -2 / (far - near);
      mat.data[11] = 0;
  
      mat.data[12] = -(right + left) / (right - left);
      mat.data[13] = -(top + bottom) / (top - bottom);
      mat.data[14] = -(far + near) / (far - near);
      mat.data[15] = 1;
      return mat;
    }

    /**
   * Applies scaling to the current matrix mutating it
   * @param x
   * @param y
   */
  scale(x: number, y: number) {
    const a11 = this.data[0];
    const a21 = this.data[1];
    const a31 = this.data[2];
    const a41 = this.data[3];

    const a12 = this.data[4];
    const a22 = this.data[5];
    const a32 = this.data[6];
    const a42 = this.data[7];

    this.data[0] = a11 * x;
    this.data[1] = a21 * x;
    this.data[2] = a31 * x;
    this.data[3] = a41 * x;

    this.data[4] = a12 * y;
    this.data[5] = a22 * y;
    this.data[6] = a32 * y;
    this.data[7] = a42 * y;

    return this;
  }
}