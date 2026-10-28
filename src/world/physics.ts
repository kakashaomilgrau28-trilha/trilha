export type Position = { x: number; y: number }
export type Obstacle = { x: number; z: number; width: number; depth: number; height?: number; canopy?: number; disabled?: boolean; polygon?: [number, number][] }
export const WORLD_SIZE = 600
export const LAPA = { lat: -25.7675993, lng: -49.7164928 }
export function geographicPosition(x: number, z: number) {
  return { lat: LAPA.lat - z / 111320, lng: LAPA.lng + x / (111320 * Math.cos(LAPA.lat * Math.PI / 180)) }
}
export function stepPosition(p: Position, dx: number, dz: number, seconds: number, speed: number, obstacles: Obstacle[], boundary = WORLD_SIZE / 2 - 4) {
  const length = Math.max(1, Math.hypot(dx, dz))
  const blocked = (x: number, z: number) => Math.abs(x) > boundary || Math.abs(z) > boundary || obstacles.some(o => {
    if(o.disabled)return false;
    if (Math.abs(x - o.x) >= o.width / 2 + .5 || Math.abs(z - o.z) >= o.depth / 2 + .5) return false
    if (!o.polygon) return true
    // Polygon containment plus a half-meter clearance around mapped buildings.
    if (pointInPolygon(x, z, o.polygon)) return true
    return o.polygon.some((a, i) => distanceToSegment(x, z, a, o.polygon![(i + 1) % o.polygon!.length]) < .5)
  })
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
export function distanceToSegment(x: number, z: number, a: [number, number], b: [number, number]) {
  const vx = b[0] - a[0], vz = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz || 1)))
  return Math.hypot(x - a[0] - t * vx, z - a[1] - t * vz)
}
export function pointInPolygon(x: number, z: number, polygon: [number, number][]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i], [xj, zj] = polygon[j]
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside
  }
  return inside
}
