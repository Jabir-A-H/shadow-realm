export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Standard Axis-Aligned Bounding Box (AABB) collision detection.
 */
export const checkAABBCollision = (boxA: BoundingBox, boxB: BoundingBox): boolean => {
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
};

/**
 * Checks whether a 2D point is contained within a bounding box.
 */
export const isPointInBox = (x: number, y: number, box: BoundingBox): boolean => {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
};

/**
 * Clamps coordinates within world bounds.
 */
export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};
