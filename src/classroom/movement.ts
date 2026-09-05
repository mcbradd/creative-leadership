export type Obstacle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Position = { x: number; z: number };
export const PLAYER_RADIUS = 0.18;
export const ROOM_LIMITS = { minX: -4.84, maxX: 4.84, minZ: -4.05, maxZ: 4.05 };

/** Small swept steps prevent tunnelling; axis separation lets the player slide along furniture. */
export function moveWithCollisions(position: Position, dx: number, dz: number, obstacles: Obstacle[]): Position {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  let { x, z } = position;
  const blocked = (px: number, pz: number) => obstacles.some(o =>
    px > o.minX - PLAYER_RADIUS && px < o.maxX + PLAYER_RADIUS &&
    pz > o.minZ - PLAYER_RADIUS && pz < o.maxZ + PLAYER_RADIUS);
  for (let i = 0; i < steps; i++) {
    const nextX = Math.max(ROOM_LIMITS.minX, Math.min(ROOM_LIMITS.maxX, x + dx / steps));
    if (!blocked(nextX, z)) x = nextX;
    const nextZ = Math.max(ROOM_LIMITS.minZ, Math.min(ROOM_LIMITS.maxZ, z + dz / steps));
    if (!blocked(x, nextZ)) z = nextZ;
  }
  return { x, z };
}
