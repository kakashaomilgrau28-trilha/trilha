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

function roof(parent: THREE.Object3D, width: number, depth: number, eave: number, rise = 1.5) {
  const left = -width / 2 - .35, right = width / 2 + .35
  const front = .4, back = -depth - .4
  const vertices = new Float32Array([
    left, eave, front, 0, eave + rise, front, left, eave, back,
    0, eave + rise, front, 0, eave + rise, back, left, eave, back,
    0, eave + rise, front, right, eave, front, 0, eave + rise, back,
    right, eave, front, right, eave, back, 0, eave + rise, back,
  ])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  const tiles = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#985c43', roughness: 1, side: THREE.DoubleSide }))
  tiles.castShadow = true; tiles.receiveShadow = true; parent.add(tiles)
  for (const z of [front, back]) {
    const gable = new THREE.Shape()
    gable.moveTo(left, eave); gable.lineTo(0, eave + rise); gable.lineTo(right, eave); gable.closePath()
    const end = new THREE.Mesh(new THREE.ShapeGeometry(gable), new THREE.MeshStandardMaterial({ color: '#f4ead6', side: THREE.DoubleSide }))
    end.position.z = z; parent.add(end)
  }
}

function facadeGroup(scene: THREE.Scene, x: number, z: number, yaw: number) {
  const group = new THREE.Group()
  group.position.set(x, .12, z); group.rotation.y = yaw; scene.add(group)
  return group
}

function windowFrame(parent: THREE.Object3D, x: number, y: number, width: number, height: number, z: number, trim = '#f1ede2') {
  box(parent, width + .25, height + .25, .12, x, y, z, trim)
  box(parent, width, height, .14, x, y, z + .09, '#426a73')
  box(parent, width + .33, .12, .25, x, y - height / 2 - .1, z + .12, trim)
  box(parent, .07, height, .18, x, y, z + .2, trim)
  box(parent, width, .07, .18, x, y, z + .21, trim)
}

function door(parent: THREE.Object3D, x: number, height: number, z: number, trim = '#e9e2d0') {
  box(parent, 1.85, height + .25, .13, x, height / 2, z, trim)
  box(parent, 1.55, height, .16, x, height / 2, z + .09, '#315568')
  box(parent, .08, height - .3, .04, x, height / 2, z + .19, '#bd9d69')
  box(parent, .08, .08, .06, x + .58, height * .45, z + .2, '#d9bd80')
}

function archedOpening(parent: THREE.Object3D, x: number, width: number, height: number, z: number, color = '#33545c') {
  const shape = new THREE.Shape()
  const r = width / 2
  shape.moveTo(-r, 0); shape.lineTo(-r, height - r)
  shape.absarc(0, height - r, r, Math.PI, 0, true)
  shape.lineTo(r, 0); shape.closePath()
  const opening = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide }))
  opening.position.set(x, .15, z); parent.add(opening)
  box(parent, .13, height - r, .13, x - r - .12, (height-r)/2, z + .02, '#f9f1d8')
  box(parent, .13, height - r, .13, x + r + .12, (height-r)/2, z + .02, '#f9f1d8')
  const arch = new THREE.Mesh(new THREE.TorusGeometry(r + .08, .1, 5, 18, Math.PI), material('#f9f1d8'))
  arch.position.set(x, height - r + .15, z + .04); parent.add(arch)
}

function landmarkTag(scene: THREE.Scene, title: string, x: number, z: number, height: number) {
  const tag = label(title); tag.position.set(x, height, z); tag.scale.multiplyScalar(1.35); scene.add(tag)
}

function church(scene: THREE.Scene) {
  // OSM building 266958811. The west front faces Praça General Carneiro.
  const group = facadeGroup(scene, -1.85, -1.2, -1.287)
  box(group, 17.5, 7.1, 43.5, 0, 3.55, -21.75, '#f0eadb')
  box(group, 17.7, .45, .4, 0, 6.9, .02, '#e4d7bc')
  roof(group, 17.5, 43.5, 7.1, 2.3)
  // Stone portal, three choir windows, curved baroque front and left bell tower.
  door(group, 0, 3.4, .28, '#c9b797')
  for (const x of [-5.1, 0, 5.1]) windowFrame(group, x, 5.05, 1.65, 1.5, .28, '#d4c4a4')
  const pediment = new THREE.Shape()
  pediment.moveTo(-8.8, 7.05); pediment.quadraticCurveTo(-5.4, 7.15, -4.2, 8.1)
  pediment.quadraticCurveTo(0, 10.2, 4.2, 8.1); pediment.quadraticCurveTo(5.4, 7.15, 8.8, 7.05)
  pediment.closePath()
  const front = new THREE.Mesh(new THREE.ShapeGeometry(pediment), material('#f4ebd9'))
  front.position.z = .55; group.add(front)
  box(group, 3.5, 12.1, 4.2, -6.9, 6.05, -2.4, '#efe7d7')
  for (const y of [7.8, 10]) windowFrame(group, -6.9, y, 1.2, 1.3, .1, '#d1bea0')
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(3, 2.6, 4), material('#8e5941'))
  towerRoof.rotation.y = Math.PI / 4; towerRoof.position.set(-6.9, 13.4, -2.4); group.add(towerRoof)
  box(group, .16, 1.2, .16, 0, 10.5, .33, '#655944')
  box(group, .8, .13, .16, 0, 10.7, .33, '#655944')
  landmarkTag(scene, 'Igreja Matriz de Santo Antônio', 18, -13, 16)
}

function theater(scene: THREE.Scene, obstacles: Obstacle[]) {
  // OSM node 3124636995: -25.76796, -49.71718; frontage on Praça General Carneiro.
  const x = -69, z = 40, width = 17, depth = 14
  const group = facadeGroup(scene, x, z, Math.PI / 2)
  box(group, width, 6.3, depth, 0, 3.15, -depth/2, '#ddb74b')
  for (const px of [-6.2, -3.1, 0, 3.1, 6.2]) archedOpening(group, px, 2.1, 4.15, .1, '#36565d')
  for (const px of [-8.25, -4.65, -1.55, 1.55, 4.65, 8.25]) box(group, .2, 6.3, .2, px, 3.15, .18, '#f5edcf')
  box(group, width + .4, .34, .65, 0, 6.25, .12, '#f4edcf')
  const pediment = new THREE.Shape()
  pediment.moveTo(-4.2, 6.45); pediment.lineTo(0, 8); pediment.lineTo(4.2, 6.45); pediment.closePath()
  const front = new THREE.Mesh(new THREE.ShapeGeometry(pediment), material('#ead18a'))
  front.position.z = .52; group.add(front)
  roof(group, width, depth, 6.45, 1.4)
  landmarkTag(scene, 'Theatro São João', x, z, 10)
  obstacles.push({ x: x - depth/2, z, width: depth, depth: width })
}

function museum(scene: THREE.Scene, obstacles: Obstacle[]) {
  // OSM node 3124636999, adjoining the theater on Rua Francisco Cunha.
  const x = -69, z = 64, width = 15, depth = 12
  const group = facadeGroup(scene, x, z, Math.PI / 2)
  box(group, width, 4.3, depth, 0, 2.15, -depth/2, '#f1e6d2')
  for (const px of [-5.4, -2.7, 2.7, 5.4]) windowFrame(group, px, 2.35, 1.4, 2.2, .12, '#ddd1b8')
  door(group, 0, 3.2, .14)
  roof(group, width, depth, 4.3, 1.4)
  landmarkTag(scene, 'Museu Histórico da Lapa', x, z, 7.5)
  obstacles.push({ x: x - depth/2, z, width: depth, depth: width })
}

function redHouse(scene: THREE.Scene, obstacles: Obstacle[]) {
  // Casa Vermelha is an OSM named point, with no surveyed footprint in this extract.
  const x = -230, z = -55, width = 13, depth = 9
  const group = facadeGroup(scene, x, z, 2.3)
  box(group, width, 3.9, depth, 0, 1.95, -depth/2, '#a8453e')
  for (const px of [-4.2, 4.2]) windowFrame(group, px, 2.2, 1.55, 1.9, .12, '#f4e9d4')
  door(group, 0, 2.85, .12, '#f4e9d4')
  roof(group, width, depth, 3.9, 1.3)
  landmarkTag(scene, 'Casa Vermelha', x, z, 7)
  obstacles.push({ x: x - Math.sin(2.3)*depth/2, z: z - Math.cos(2.3)*depth/2, width: 16, depth: 16 })
}

function pantheon(scene: THREE.Scene, obstacles: Obstacle[]) {
  // OSM memorial node 3124636997 in the landscaped square to the south.
  const x = -5, z = 112, width = 12, depth = 8
  const group = facadeGroup(scene, x, z, 0)
  box(group, width, 5, depth, 0, 2.5, -depth/2, '#e8e8e1')
  box(group, width + .8, .45, depth + .8, 0, 5.1, -depth/2, '#d3d4cf')
  box(group, 4.4, 3.7, .12, 0, 2, .18, '#555957')
  for (const px of [-4.4, -2.7, 2.7, 4.4]) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 4.1, 10), material('#f6f6f0'))
    column.position.set(px, 2.2, 1); group.add(column)
    box(group, .95, .22, .85, px, 4.35, 1, '#f6f6f0')
  }
  for (let i = 0; i < 4; i++) box(group, 11.8 - i*.7, .18, 1.1, 0, .12 + i*.17, 4.2 - i*.9, '#c5c7c3')
  landmarkTag(scene, 'Panteon dos Heroes', x, z, 8)
  obstacles.push({ x, z: z-depth/2, width, depth })
}

function colonialHouse(scene: THREE.Scene, x: number, z: number, yaw: number, width: number, depth: number, index: number) {
  const group = facadeGroup(scene, x, z, yaw)
  const walls = ['#eee5d1', '#efd7a6', '#e8e2d5', '#d9e4df', '#efd9cc']
  const trims = ['#41687b', '#e8e9dc', '#708469', '#5c7590', '#a86d5a']
  const wall = walls[index % walls.length], trim = trims[index % trims.length]
  const height = index % 5 === 0 ? 5.8 : 3.8
  box(group, width, height, depth, 0, height/2, -depth/2, wall)
  roof(group, width, depth, height, Math.min(1.6, width * .14))
  const count = Math.max(2, Math.floor(width / 2.7))
  for (let i = 0; i < count; i++) {
    const px = -width/2 + width * (i+.5)/count
    if (i === Math.floor(count/2)) door(group, px, 2.7, .12, trim)
    else windowFrame(group, px, 2.35, 1.05, 1.65, .12, trim)
    if (height > 5 && i !== Math.floor(count/2)) windowFrame(group, px, 4.6, 1.05, 1.3, .12, trim)
  }
}

function landmarkFacade(scene: THREE.Scene, name: string) {
  if (name === 'Casa Lacerda') {
    const group = facadeGroup(scene, 25.5, 95.5, -1.3)
    box(group, 20, 4.3, .35, 0, 2.15, .12, '#dfba64')
    for (const x of [-7.2, -3.6, 3.6, 7.2]) windowFrame(group, x, 2.45, 1.45, 2.1, .35, '#f7ebd3')
    door(group, 0, 3.1, .35, '#f7ebd3')
  }
  if (name === 'Prefeitura Municipal da Lapa') {
    const group = facadeGroup(scene, -46.35, 121.45, 1.91)
    box(group, 29, 4.4, .3, 0, 2.2, .1, '#dfba59')
    for (const x of [-10, -6, -3, 3, 6, 10]) archedOpening(group, x, 1.8, 3.4, .31, '#426276')
    door(group, 0, 3.2, .33, '#f8f1dc')
  }
  if (name === 'Museu da Moda') {
    const group = facadeGroup(scene, -24, 161, -1.4)
    box(group, 15, 4.1, .28, 0, 2.05, .1, '#eee5d5')
    for (const x of [-5.3, -2.7, 2.7, 5.3]) windowFrame(group, x, 2.2, 1.1, 1.8, .25, '#a84c3c')
    door(group, 0, 2.8, .27, '#b4503d')
  }
}

function monument(scene: THREE.Scene, x: number, z: number) {
  // Statue of General Gomes Carneiro at the center of his namesake square.
  const group = facadeGroup(scene, x, z, 0)
  box(group, 5.6, .35, 5.6, 0, .2, 0, '#afa89a')
  box(group, 3.6, .4, 3.6, 0, .55, 0, '#d4cfc1')
  box(group, 2.5, 2.8, 2.5, 0, 2.1, 0, '#b7b3a7')
  box(group, 2.8, .22, 2.8, 0, 3.6, 0, '#d1ccbe')
  const bronze = material('#5b5748')
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.52, .43, 1.7, 8), bronze)
  torso.position.y = 4.8; group.add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(.33, 12, 8), bronze)
  head.position.y = 5.9; group.add(head)
  for (const side of [-1, 1]) box(group, .26, 1.2, .3, side*.31, 3.7, 0, '#5b5748')
  box(group, .12, 2.2, .12, .75, 4.35, .15, '#574f3d')
  landmarkTag(scene, 'General Gomes Carneiro', x, z, 8)
}

function lamp(scene: THREE.Scene, x: number, z: number) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .11, 4.3, 8), material('#323c38'))
  pole.position.set(x, 2.15, z); scene.add(pole)
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 8), new THREE.MeshStandardMaterial({ color: '#fff2c2', emissive: '#e9ba65', emissiveIntensity: .5 }))
  lantern.position.set(x, 4.35, z); scene.add(lantern)
}

function strip(scene: THREE.Scene, ax: number, az: number, bx: number, bz: number, width: number, color: string, y: number) {
  const length = Math.hypot(bx - ax, bz - az)
  if (length < .2) return
  const mesh = box(scene, width, .035, length + .3, (ax+bx)/2, y, (az+bz)/2, color)
  mesh.rotation.y = Math.atan2(bx-ax, bz-az)
}

function distanceToSegment(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const lengthSq = (bx-ax)**2 + (bz-az)**2
  const t = Math.max(0, Math.min(1, ((x-ax)*(bx-ax) + (z-az)*(bz-az)) / Math.max(.001, lengthSq)))
  return Math.hypot(x-ax-t*(bx-ax), z-az-t*(bz-az))
}

function contextHouses(scene: THREE.Scene, obstacles: Obstacle[]) {
  // Low-rise casario fills OSM gaps. These individual parcels are illustrative.
  const streets = lapa.roads.filter(r => !['footway', 'path', 'pedestrian', 'steps', 'service'].includes(r.kind))
    .sort((a,b) => Math.min(...a.points.map(([x,z]) => Math.hypot(x,z))) - Math.min(...b.points.map(([x,z]) => Math.hypot(x,z))))
  let count = 0
  for (const road of streets) {
    if (count >= 42) break
    for (let segment = 1; segment < road.points.length; segment++) {
      if (count >= 42) break
      const [ax, az] = road.points[segment-1], [bx, bz] = road.points[segment]
      const length = Math.hypot(bx-ax, bz-az)
      if (length < 20) continue
      const ux = (bx-ax)/length, uz = (bz-az)/length
      for (let step = 10; step < length-5; step += 16) {
        if (count >= 42) break
        const roadX = ax + ux*step, roadZ = az + uz*step
        if (Math.hypot(roadX, roadZ) > 170) continue
        for (const side of [-1, 1]) {
          if (count >= 42) break
          const index = road.id + segment*19 + step + side
          if (index % 4 === 0) continue
          const nx = -uz*side, nz = ux*side
          const width = 8.5 + index % 3, depth = 7.5 + index % 2
          const frontX = roadX + nx*6.5, frontZ = roadZ + nz*6.5
          const yaw = Math.atan2(-nx, -nz)
          const corners = [[-width/2, 0], [width/2, 0], [width/2, -depth], [-width/2, -depth]]
            .map(([u, v]) => [frontX + Math.cos(yaw)*u + Math.sin(yaw)*v, frontZ - Math.sin(yaw)*u + Math.cos(yaw)*v] as [number, number])
          const centerX = frontX + nx*depth/2, centerZ = frontZ + nz*depth/2
          const xs = corners.map(c => c[0]), zs = corners.map(c => c[1])
          const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
          if (lapa.parks.some(park => [...corners, [centerX,centerZ]].some(([x,z]) => pointInPolygon(x,z,park.points as [number,number][])))) continue
          if (obstacles.some(o => x0 < o.x+o.width/2+1.2 && x1 > o.x-o.width/2-1.2 && z0 < o.z+o.depth/2+1.2 && z1 > o.z-o.depth/2-1.2)) continue
          const crossesStreet = streets.some(other => other.points.some((point, i) => i > 0 && corners.some(([x,z]) => distanceToSegment(x,z,other.points[i-1][0],other.points[i-1][1],point[0],point[1]) < 4.8)))
          if (crossesStreet) continue
          colonialHouse(scene, frontX, frontZ, yaw, width, depth, index)
          obstacles.push({ x: (x0+x1)/2, z: (z0+z1)/2, width: x1-x0, depth: z1-z0, polygon: corners })
          count++
        }
      }
    }
  }
}

export function buildTown(scene: THREE.Scene) {
  const obstacles: Obstacle[] = []
  box(scene, 610, .2, 610, 0, -.18, 0, '#9ea98d')
  for (const road of lapa.roads) {
    const pedestrian = ['footway', 'path', 'pedestrian', 'steps'].includes(road.kind)
    const width = pedestrian ? 2.4 : road.kind === 'residential' ? 7 : 8.5
    for (let i = 1; i < road.points.length; i++) {
      const [ax, az] = road.points[i - 1], [bx, bz] = road.points[i]
      strip(scene, ax, az, bx, bz, width + (pedestrian ? 0 : 3.2), pedestrian ? '#c8bda8' : '#d5d0bd', .005)
      if (!pedestrian) strip(scene, ax, az, bx, bz, width, '#8c8d85', .035)
    }
  }
  for (const park of lapa.parks) {
    const shape = footprint(park.points, .045, park.name === 'Praça General Carneiro' ? '#7f9f76' : '#87a580')
    shape.position.y = .07; scene.add(shape)
    if (park.name) {
      const center = park.points.reduce((p, q) => [p[0] + q[0] / park.points.length, p[1] + q[1] / park.points.length], [0, 0])
      const tag = label(park.name); tag.position.set(center[0], 4, center[1]); scene.add(tag)
    }
  }
  const palette = ['#ece2ca', '#e8d3b9', '#f1e9d7', '#e7d3a4', '#d8e1d7', '#e9dacb']
  for (const building of lapa.buildings) {
    const points = building.points as [number, number][]
    const xs = points.map(p => p[0]), zs = points.map(p => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
    const isChurch = building.name === 'Igreja Matriz Santo Antônio'
    const height = isChurch ? 7.1 : 3.7 * building.levels + 1
    if (!isChurch) {
      const color = building.name === 'Casa Lacerda' || building.name === 'Prefeitura Municipal da Lapa' ? '#dfba64' : palette[building.id % palette.length]
      const wall = footprint(points, height, color); wall.position.y = .08; scene.add(wall)
      const tiledRoof = footprint(points, .2, '#985c43'); tiledRoof.position.y = height + .08; scene.add(tiledRoof)
    }
    obstacles.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, width: x1 - x0, depth: z1 - z0, polygon: points })
    if (!isChurch && building.name && x1 - x0 > 3) {
      landmarkFacade(scene, building.name)
      landmarkTag(scene, building.name, (x0+x1)/2, (z0+z1)/2, height+2)
    }
  }
  church(scene)
  theater(scene, obstacles)
  museum(scene, obstacles)
  redHouse(scene, obstacles)
  pantheon(scene, obstacles)
  // The central bronze monument and planted cross paths define the square.
  strip(scene, -65, 20, 65, -20, 4.3, '#d5c9af', .13)
  strip(scene, 6, 19, -6, -19, 4.3, '#d5c9af', .14)
  const circle = new THREE.Mesh(new THREE.CylinderGeometry(7.8, 7.8, .06, 28), material('#d5c9af'))
  circle.position.y = .17; scene.add(circle)
  monument(scene, 0, 0)
  for (const [x,z] of [[-49,16],[-38,-9],[-27,18],[-13,-13],[20,12],[33,-13],[48,-18],[53,-3]]) {
    box(scene, .35, 2.8, .35, x, 1.5, z, '#655a42')
    const crown = new THREE.Mesh(new THREE.SphereGeometry(2.7, 9, 7), material('#4d7752'))
    crown.position.set(x, 3.9, z); crown.scale.set(1.2,.85,1); scene.add(crown)
    obstacles.push({ x, z, width: .5, depth: .5 })
  }
  for (const [x,z] of [[-58,17],[-42,-22],[-20,26],[20,-28],[46,17],[58,-14]]) lamp(scene,x,z)
  contextHouses(scene, obstacles)
  for (const place of lapa.places.filter(place => ['Memorial Ney Braga', 'Fonte Quebra Pote'].includes(place.name)))
    landmarkTag(scene, place.name, place.point[0], place.point[1], 5)
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
