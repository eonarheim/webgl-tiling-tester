

import { Matrix } from "./matrix";
import { vec, Vector } from "./vector";

export interface Dimension {
    width: number;
    height: number;
}


function toScreenSpace(coord: Vector, resolution: Dimension, screen: Dimension) {
    // Map coordinate to screen space
    let screenSpacePos = vec(
        (coord.x / resolution.width) * screen.width,
        (coord.y / resolution.height) * screen.height);

    return screenSpacePos;
}


function toWorldSpace(coord: Vector, resolution: Dimension, screen: Dimension) {
    // Map coordinate to world space
    let worldSpacePos = vec(
        (coord.x / screen.width) * resolution.width,
        (coord.y / screen.height) * resolution.height);

    return worldSpacePos;
}


/**
 * Pushes a world space coordintate towards the nearest screen pixel (floor)
 */
export function nudgeToScreenPixelFloor(transform: Matrix, coord: Vector, resolution: Dimension): Vector {
    coord = transform.getAffineInverse().multv(coord);
    const screen = {
        width: resolution.width * window.devicePixelRatio,
        height: resolution.height * window.devicePixelRatio
    };

    let screenSpacePos = toScreenSpace(coord, resolution, screen);

    // Adjust by half a pixel "bodge" factor
    const screenSpacePosBodge = screenSpacePos.add(vec(0.5, 0.5));

    // Find the nearest screen pixel
    const nearestScreenPixelFloor = vec(
        Math.floor(screenSpacePosBodge.x),
        Math.floor(screenSpacePosBodge.y));
    
    // Convert back to game resolution
    const worldSpace = toWorldSpace(nearestScreenPixelFloor, resolution, screen);

    // Transform back to world coordinate
    return transform.multv(worldSpace);
}

/**
 * Pushes a world space coordintate towards the nearest screen pixel (ceiling)
 */
export function nudgeToScreenPixelCeil(transform: Matrix, coord: Vector, resolution: Dimension): Vector {
    coord = transform.getAffineInverse().multv(coord);
    const screen = {
        width: resolution.width * window.devicePixelRatio,
        height: resolution.height * window.devicePixelRatio
    };

    let screenSpacePos = toScreenSpace(coord, resolution, screen);

    // Adjust by half a pixel "bodge" factor
    const screenSpacePosBodge = screenSpacePos.add(vec(0.5, 0.5));

    // Find the nearest screen pixel
    const nearestScreenPixelFloor = vec(
        Math.ceil(screenSpacePosBodge.x),
        Math.ceil(screenSpacePosBodge.y));
    
    // Convert back to game resolution
    const worldSpace = toWorldSpace(nearestScreenPixelFloor, resolution, screen);

    // Transform back to world coordinate
    return transform.multv(worldSpace);
}