import { Tile } from "./tile";

export function generateTiles(tileRows: number, tileColumns: number, tileWidthPixels: number, tileHeightPixels: number): Tile[] {
    const tiles: Tile[] = [];
    const tileXs: number[] = [];
    const tileYs: number[] = [];
    // Precoumpute all the x's & y's for the tile geometry
    // this keeps us from getting into trouble with floating point math 
    for (let x = 0; x < (tileColumns + 1); x++) {
        tileXs[x] = x * tileWidthPixels;
    }
    for (let y = 0; y < (tileRows + 1); y++) {
        tileYs[y] = y * tileHeightPixels;
    }

    // Create tile geometry that share the same edges
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
    return tiles;
}