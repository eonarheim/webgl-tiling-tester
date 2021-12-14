import { Tile } from "./tile";

export function generateTiles(rows: number, columns: number, tileWidthPixels: number, tileHeightPixels: number): Tile[] {
    const tiles: Tile[] = [];
    const tileHalfWidth = tileWidthPixels / 2;
    const tileHalfHeight = tileHeightPixels / 2;
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            const centerX = x * tileWidthPixels + tileHalfWidth;
            const centerY = y * tileHeightPixels + tileHalfHeight;
            const tile = new Tile({
                left: centerX - tileHalfWidth,
                right: centerX + tileHalfWidth,
                top: centerY - tileHalfHeight,
                bottom: centerY + tileHalfHeight
            });
            tiles.push(tile);
        }
    }
    return tiles;
}