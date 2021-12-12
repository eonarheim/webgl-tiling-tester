
export interface TileOptions {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
export class Tile {
    public left: number = 0;
    public right: number = 0;
    public top: number = 0;
    public bottom: number = 0;
    constructor(options: TileOptions) {
        this.left = options.left;
        this.right = options.right;
        this.top = options.top;
        this.bottom = options.bottom;
    }
}