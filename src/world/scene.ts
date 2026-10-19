import * as THREE from 'three'
import lapa from '../data/lapa-center-osm.json'
import type { Obstacle } from './physics'
import { pointInPolygon } from './physics'

export const looks = [
  { shirt: '#d59b57', skin: '#bb825b', hair: '#332921' },
  { shirt: '#7199a5', skin: '#e2b38d', hair: '#49312b' },
  { shirt: '#66917a', skin: '#805337', hair: '#211e20' },
  { shirt: '#bf7f74', skin: '#b97d55', hair: '#322421' },
  { shirt: '#9380b4', skin: '#e3b590', hair: '#633b26' },
  { shirt: '#be945a', skin: '#724d39', hair: '#201d1b' },
]
function material(color: string) { return new THREE.MeshStandardMaterial({ color, roughness: .88 }) }
export function box(parent: THREE.Object3D, width: number, height: number, depth: number, x: number, y: number, z: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color))
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh)
  return mesh
}
export function person(index: number) {
  const colors = looks[index % looks.length]
  const root = new THREE.Group()
  const body = new THREE.Group(); root.add(body)
  box(body, .53, .65, .28, 0, 1.12, 0, colors.shirt)
  box(body, .48, .12, .3, 0, .82, 0, '#344d46')
  box(body, .13, .12, .16, 0, 1.48, 0, colors.skin)
  const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 16, 12), material(colors.skin))
  head.scale.set(.9, 1.1, .9); head.position.y = 1.71; body.add(head); head.castShadow = true
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.235, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(colors.hair))
  hair.position.y = 1.76; body.add(hair)
  for (const x of [-.08, .08]) box(body, .035, .04, .025, x, 1.72, .19, '#252b28')
  box(body, .065, .06, .06, 0, 1.65, .2, colors.skin)
  box(body, .09, .02, .025, 0, 1.58, .18, '#855347')
  // Yellow scarf and backpack, with articulated limb pivots.
  const scarf = box(body, .15, .27, .035, 0, 1.3, .165, '#f3cb5d'); scarf.rotation.z = -.25
  box(body, .37, .46, .18, 0, 1.13, -.22, '#3f6353')
  const legs: THREE.Group[] = [], arms: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .145, .8, 0); body.add(leg)
    box(leg, .21, .63, .23, 0, -.31, 0, '#334b50')
    box(leg, .23, .14, .34, 0, -.73, .05, '#292c2a'); legs.push(leg)
    const arm = new THREE.Group(); arm.position.set(side * .36, 1.4, 0); body.add(arm)
    box(arm, .18, .3, .22, 0, -.14, 0, colors.shirt)
    box(arm, .14, .3, .17, 0, -.43, 0, colors.skin); arms.push(arm)
  }
  return { root, animate(time: number, moving: boolean) {
    const stride = moving ? Math.sin(time * 10) * .65 : 0
    legs[0].rotation.x = stride; legs[1].rotation.x = -stride
    arms[0].rotation.x = -stride; arms[1].rotation.x = stride
    body.position.y = moving ? Math.abs(Math.sin(time * 10)) * .045 : Math.sin(time * 2) * .012
  } }
}

export function label(text: string) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(24,48,40,.88)'; ctx.beginPath(); ctx.roundRect(0, 0, 512, 96, 24); ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = '600 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 48, 480)
  const map = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: true }))
  sprite.scale.set(3.5, .65, 1); return sprite
}

function footprint(points: number[][], height: number, color: string) {
  const shape = new THREE.Shape()
  points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z))
  shape.closePath()
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false }), material(color))
  mesh.rotation.x = -Math.PI / 2; mesh.castShadow = true; mesh.receiveShadow = true
  return mesh
}

export function buildTown(scene: THREE.Scene) {
  const obstacles: Obstacle[] = []
  box(scene, 610, .2, 610, 0, -.18, 0, '#a9b990')
  for (const road of lapa.roads) {
    const pedestrian = ['footway', 'path', 'pedestrian', 'steps'].includes(road.kind)
    const width = pedestrian ? 2.4 : road.kind === 'residential' ? 7 : 8.5
    for (let i = 1; i < road.points.length; i++) {
      const [ax, az] = road.points[i - 1], [bx, bz] = road.points[i]
      const length = Math.hypot(bx - ax, bz - az)
      if (length < .2) continue
      const angle = Math.atan2(bx - ax, bz - az)
      const sidewalk = box(scene, width + (pedestrian ? 0 : 3.2), .025, length + .5, (ax + bx) / 2, .005, (az + bz) / 2, pedestrian ? '#cdbda0' : '#d8d4c7')
      sidewalk.rotation.y = angle
      if (!pedestrian) {
        const lane = box(scene, width, .025, length + .5, (ax + bx) / 2, .035, (az + bz) / 2, '#747d7b')
        lane.rotation.y = angle
      }
    }
  }
  for (const park of lapa.parks) {
    const shape = footprint(park.points, .045, park.name === 'Praça General Carneiro' ? '#85a97f' : '#83a48a')
    shape.position.y = .07; scene.add(shape)
    if (park.name) {
      const center = park.points.reduce((p, q) => [p[0] + q[0] / park.points.length, p[1] + q[1] / park.points.length], [0, 0])
      const tag = label(park.name); tag.position.set(center[0], 4, center[1]); tag.scale.multiplyScalar(2); scene.add(tag)
    }
  }
  const palette = ['#e4c5a5', '#c98271', '#e8dec4', '#d5b680', '#acc0b2', '#c2b6ab']
  for (const building of lapa.buildings) {
    const points = building.points as [number, number][]
    const xs = points.map(p => p[0]), zs = points.map(p => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
    const church = building.name === 'Igreja Matriz Santo Antônio'
    const height = church ? 10 : 3.7 * building.levels + 1
    const wall = footprint(points, height, church ? '#efe4c9' : palette[building.id % palette.length]); wall.position.y = .08; scene.add(wall)
    const roof = footprint(points, .2, building.id % 2 ? '#9c6652' : '#a57e60'); roof.position.y = height + .08; scene.add(roof)
    obstacles.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, width: x1 - x0, depth: z1 - z0, polygon: points })
    if (building.name && x1 - x0 > 3) { const tag = label(building.name); tag.position.set((x0+x1)/2, height+2, (z0+z1)/2); scene.add(tag) }
  }
  // Trees add atmosphere without claiming exact surveyed positions.
  const plaza = lapa.parks.find(park => park.name === 'Praça General Carneiro')
  if (plaza) for (let x = -38; x <= 38; x += 9) for (let z = -38; z <= 38; z += 9) {
    if (!pointInPolygon(x, z, plaza.points as [number, number][])) continue
    if ((Math.abs(x)+Math.abs(z)) % 3 === 0 || Math.hypot(x,z) < 10 || obstacles.some(o => o.polygon && pointInPolygon(x, z, o.polygon))) continue
    box(scene, .4, 2.3, .4, x, 1.2, z, '#705c42')
    const crown = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 6), material('#537d58'))
    crown.position.set(x, 3, z); scene.add(crown)
    obstacles.push({ x, z, width: .5, depth: .5 })
  }
  for (const place of lapa.places.filter(place => ['Museu Histórico', 'Casa Vermelha', 'Memorial Ney Braga'].includes(place.name))) {
    const tag = label(place.name); tag.position.set(place.point[0], 6, place.point[1]); scene.add(tag)
  }
  return obstacles
}

export function disposeScene(scene: THREE.Scene) {
  scene.traverse(node => {
    if (node instanceof THREE.Mesh || node instanceof THREE.Sprite) {
      if (node instanceof THREE.Mesh) node.geometry.dispose()
      for (const mat of Array.isArray(node.material) ? node.material : [node.material]) {
        if ('map' in mat && mat.map instanceof THREE.Texture) mat.map.dispose()
        mat.dispose()
      }
    }
  })
}
