import { Vector } from "./vector";

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
     * Creates a new identity matrix (a matrix that when applied does nothing)
     */
  public static identity(): Matrix {
    const mat = new Matrix();
    mat.data[0] = 1;
    mat.data[1] = 0;
    mat.data[2] = 0;
    mat.data[3] = 0;

    mat.data[4] = 0;
    mat.data[5] = 1;
    mat.data[6] = 0;
    mat.data[7] = 0;

    mat.data[8] = 0;
    mat.data[9] = 0;
    mat.data[10] = 1;
    mat.data[11] = 0;

    mat.data[12] = 0;
    mat.data[13] = 0;
    mat.data[14] = 0;
    mat.data[15] = 1;
    return mat;
  }

  /**
   * Creates a new Matrix with the same data as the current 4x4
   */
  public clone(): Matrix {
    const mat = new Matrix();
    mat.data[0] = this.data[0];
    mat.data[1] = this.data[1];
    mat.data[2] = this.data[2];
    mat.data[3] = this.data[3];

    mat.data[4] = this.data[4];
    mat.data[5] = this.data[5];
    mat.data[6] = this.data[6];
    mat.data[7] = this.data[7];

    mat.data[8] = this.data[8];
    mat.data[9] = this.data[9];
    mat.data[10] = this.data[10];
    mat.data[11] = this.data[11];

    mat.data[12] = this.data[12];
    mat.data[13] = this.data[13];
    mat.data[14] = this.data[14];
    mat.data[15] = this.data[15];
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

  /**
   * Applies translation to the current matrix mutating it
   * @param x
   * @param y
   */
  translate(x: number, y: number) {
    const a11 = this.data[0];
    const a21 = this.data[1];
    const a31 = this.data[2];
    const a41 = this.data[3];

    const a12 = this.data[4];
    const a22 = this.data[5];
    const a32 = this.data[6];
    const a42 = this.data[7];

    const a13 = this.data[8];
    const a23 = this.data[9];
    const a33 = this.data[10];
    const a43 = this.data[11];

    const a14 = this.data[12];
    const a24 = this.data[13];
    const a34 = this.data[14];
    const a44 = this.data[15];

    // Doesn't change z
    const z = 0;
    const w = 1;
    this.data[12] = a11 * x + a12 * y + a13 * z + a14 * w;
    this.data[13] = a21 * x + a22 * y + a23 * z + a24 * w;
    this.data[14] = a31 * x + a32 * y + a33 * z + a34 * w;
    this.data[15] = a41 * x + a42 * y + a43 * z + a44 * w;

    return this;
  }

  /**
   * Applies rotation to the current matrix mutating it
   * @param angle in Radians
   */
  rotate(angle: number) {
    const a11 = this.data[0];
    const a21 = this.data[1];
    const a31 = this.data[2];
    const a41 = this.data[3];

    const a12 = this.data[4];
    const a22 = this.data[5];
    const a32 = this.data[6];
    const a42 = this.data[7];

    const sine = Math.sin(angle);
    const cosine = Math.cos(angle);

    this.data[0] = cosine * a11 + sine * a12;
    this.data[1] = cosine * a21 + sine * a22;
    this.data[2] = cosine * a31 + sine * a32;
    this.data[3] = cosine * a41 + sine * a42;

    this.data[4] = cosine * a12 - sine * a11;
    this.data[5] = cosine * a22 - sine * a21;
    this.data[6] = cosine * a32 - sine * a31;
    this.data[7] = cosine * a42 - sine * a41;

    return this;
  }

  /**
   * Multiplies the current matrix by a vector and returns the resulting vector
   * @param other
   */
  multv(other: [number, number]): [number, number];
  multv(other: Vector): Vector;
  multv(other: [number, number] | Vector): [number, number] | Vector {
    const z = 0;
    if (other instanceof Vector) {
      return new Vector(
        other.x * this.data[0] + other.y * this.data[4] + z * this.data[6] + 1 * this.data[12],
        other.x * this.data[1] + other.y * this.data[5] + z * this.data[9] + 1 * this.data[13]
      );
    } else {
      const dest: [number, number] = [
        other[0] * this.data[0] + other[1] * this.data[4] + z * this.data[6] + 1 * this.data[12],

        other[0] * this.data[1] + other[1] * this.data[5] + z * this.data[9] + 1 * this.data[13]
      ];
      return dest;
    }
  }
}