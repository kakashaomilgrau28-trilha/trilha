import * as THREE from 'three'
import type { Obstacle } from './physics'

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

export function buildTown(scene: THREE.Scene, clearings: { x: number; z: number }[] = []) {
  const obstacles: Obstacle[] = []
  box(scene, 260, .2, 260, 0, -.18, 0, '#8caa74')
  // Original stylized town, not digitized Google imagery or an asserted city survey.
  for (const x of [-70, 0, 70]) {
    box(scene, 12, .08, 240, x, -.03, 0, '#747b79')
    box(scene, 17, .04, 240, x, -.065, 0, '#d6d0bd')
  }
  for (const z of [-70, 0, 70]) {
    box(scene, 240, .08, 12, 0, -.02, z, '#747b79')
    box(scene, 240, .04, 17, 0, -.055, z, '#d6d0bd')
    for (let x = -110; x < 120; x += 12) box(scene, 4, .01, .16, x, .03, z, '#e9d69b')
  }
  box(scene, 43, .12, 43, 27, 0, -28, '#cfbfa0')
  box(scene, 28, .12, 28, 27, .02, -28, '#a6b482')
  const palette = ['#e7c493', '#c77c64', '#e5dec7', '#e5b965', '#9bb7ae', '#bdc5ce']
  for (let i = 0; i < 32; i++) {
    const x = (i % 8) * 28 - 98, z = Math.floor(i / 8) * 56 - 84
    if (Math.abs(x) < 12 || Math.abs(x - 70) < 12 || Math.abs(x + 70) < 12 || (x > 5 && x < 55 && z < 0 && z > -56)) continue
    const w = 12 + (i % 3), d = 12, h = 4 + i % 3
    if (clearings.some(p => Math.abs(p.x - x) < w / 2 + 6 && Math.abs(p.z - z) < d / 2 + 6)) continue
    box(scene, w, h, d, x, h / 2, z, palette[i % palette.length])
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 1, 4), material('#a35e45'))
    roof.scale.set(w * .78, 3, d * .78); roof.rotation.y = Math.PI / 4; roof.position.set(x, h + 1.5, z); scene.add(roof); roof.castShadow = true
    for (const side of [-1, 1]) for (const offset of [-3.7, 3.7]) {
      box(scene, 1.6, 2, .12, x + offset, 2.3, z + side * 6.04, '#f6edd9')
      box(scene, 1.2, 1.6, .14, x + offset, 2.3, z + side * 6.11, '#547b7c')
    }
    box(scene, 1.7, 2.7, .15, x, 1.35, z + 6.1, '#604c3a')
    obstacles.push({ x, z, width: w, depth: d })
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.sin(i * 17.3) * 108, z = Math.cos(i * 11.1) * 108
    if ([-70, 0, 70].some(v => Math.abs(x-v) < 11 || Math.abs(z-v) < 11) || obstacles.some(o => Math.abs(x-o.x)<12 && Math.abs(z-o.z)<12)) continue
    box(scene, .5, 4, .5, x, 2, z, '#73543d')
    for (let j = 0; j < 3; j++) {
      const crown = new THREE.Mesh(new THREE.ConeGeometry(2.7 - j * .5, 2.8, 8), material(j % 2 ? '#486e4b' : '#547e51'))
      crown.position.set(x, 4 + j * 1.1, z); crown.castShadow = true; scene.add(crown)
    }
    obstacles.push({ x, z, width: .8, depth: .8 })
  }
  for (const x of [-9, 9]) for (let z = -105; z < 110; z += 28) {
    box(scene, .14, 4, .14, x, 2, z, '#3d4942')
    box(scene, .5, .6, .5, x, 4, z, '#f6dda1')
  }
  const sign = label('LAPA · PARANÁ'); sign.position.set(0, 6, -18); sign.scale.multiplyScalar(3); scene.add(sign)
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
