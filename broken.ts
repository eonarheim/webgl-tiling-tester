import { Tile } from "./tile";
import { TransformStack } from "./transform-stack";
import { vec } from "./vector";

export function generateTiles(rows: number, columns: number, tileWidthPixels: number, tileHeightPixels: number): Tile[] {
    const tiles: Tile[] = [];
    const tileHalfWidth = tileWidthPixels / 2;
    const tileHalfHeight = tileHeightPixels / 2;
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            const centerX = x * tileWidthPixels + tileHalfWidth;
            const centerY = y * tileHeightPixels + tileHalfHeight;
            const tile = new Tile({
                left: ~~(centerX - tileHalfWidth),
                right: ~~(centerX + tileHalfWidth),
                top: ~~(centerY - tileHalfHeight),
                bottom: ~~(centerY + tileHalfHeight)
            });
            tiles.push(tile);
        }
    }
    return tiles;
}

export function generateTiles2(transform: TransformStack, rows: number, columns: number, tileWidthPixels: number, tileHeightPixels: number): Tile[] {
    const tiles: Tile[] = [];
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {

            transform.save();
            transform.translate(x * tileWidthPixels, y * tileHeightPixels)

            let topLeft = vec(0, 0);
            let bottomRight = vec(tileWidthPixels, tileHeightPixels);

            // AVOID THIS: wait until the last moment to manipulate geometry with a matrix 
            topLeft = transform.current.multv(topLeft);
            bottomRight = transform.current.multv(bottomRight);
            
            const tile = new Tile({
                left: topLeft.x,
                right: bottomRight.x,
                top: topLeft.y,
                bottom: bottomRight.y
            });
            tiles.push(tile);

            transform.restore();
        }
    }
    return tiles;
}