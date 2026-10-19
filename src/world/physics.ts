export type Position = { x: number; y: number }
export type Obstacle = { x: number; z: number; width: number; depth: number }
export const WORLD_SIZE = 240
export const LAPA = { lat: -25.769722, lng: -49.715833 }
export function geographicPosition(x: number, z: number) {
  return { lat: LAPA.lat - z / 111320, lng: LAPA.lng + x / (111320 * Math.cos(LAPA.lat * Math.PI / 180)) }
}
export function stepPosition(p: Position, dx: number, dz: number, seconds: number, speed: number, obstacles: Obstacle[]) {
  const length = Math.max(1, Math.hypot(dx, dz))
  const blocked = (x: number, z: number) => Math.abs(x) > 116 || Math.abs(z) > 116 || obstacles.some(o => Math.abs(x - o.x) < o.width / 2 + .4 && Math.abs(z - o.z) < o.depth / 2 + .4)
  let x = p.x
  let z = p.y
  // Small substeps prevent tunneling and permit sliding along walls.
  const steps = Math.max(1, Math.ceil(speed * seconds / .2))
  for (let i = 0; i < steps; i++) {
    const nx = x + dx / length * speed * seconds / steps
    if (!blocked(nx, z)) x = nx
    const nz = z + dz / length * speed * seconds / steps
    if (!blocked(x, nz)) z = nz
  }
  return { x, y: z }
}
