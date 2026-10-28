import * as T from "three";
import { box as plainBox, label } from "../world/character";
import type { Obstacle } from "../world/physics";
import {buildLandscape} from './landscape';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {polishCamp} from './ambience';
import {batchStaticWorld} from './rendering';
function box(...args:Parameters<typeof plainBox>){const mesh=plainBox(...args);const [,w,h,d]=args;if(Math.min(w,h,d)>.08&&Math.max(w,h,d)<12){mesh.geometry.dispose();mesh.geometry=new RoundedBoxGeometry(w,h,d,1,Math.min(.045,w/5,h/5,d/5))}return mesh}
import {destinations} from './exploration';
export {SIZE} from './exploration';
export const places = [
  {
    id: "fogueira",
    name: "Fogueira da amizade",
    x: 0,
    z: 0,
    description: "Sente na roda, acene e encontre sua turma.",
  },
  {
    id: "acampamento",
    name: "Bosque das barracas",
    x: -23,
    z: -18,
    description: "Um cantinho para descansar entre as aventuras.",
  },
  {
    id: "oficina",
    name: "Oficina de pioneirias",
    x: 23,
    z: -18,
    description: "Nós, amarras e equipamentos de campo.",
  },
  {
    id: "lago",
    name: "Lago da tranquilidade",
    x: -24,
    z: 18,
    description: "Um píer de madeira para conversar e observar a natureza.",
  },
  {
    id: "observatorio",
    name: "Mirante das estrelas",
    x: 25,
    z: 18,
    description: "Um telescópio para descobrir as constelações.",
  },
  {
    id: "vip",
    name: "Refúgio VIP",
    x: 0,
    z: -31,
    description: "Jardim reservado, lounge e observatório exclusivo.",
  },
];
places.push({id:'abrigo-campo',name:'Abrigo do acampamento',x:0,z:30,description:'Um teto para descansar entre as trilhas.'},...destinations);
const mat = (color: string) =>
  new T.MeshStandardMaterial({ color, roughness: 0.85 });
function cylinder(
  parent: T.Object3D,
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  color: string,
  segments = 16,
) {
  const m = new T.Mesh(new T.CylinderGeometry(r, r, h, segments), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function sphere(
  parent: T.Object3D,
  r: number,
  x: number,
  y: number,
  z: number,
  color: string,
) {
  const m = new T.Mesh(new T.SphereGeometry(r, 16, 10), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function pole(
  parent: T.Object3D,
  a: T.Vector3,
  b: T.Vector3,
  r: number,
  color: string,
) {
  const delta = b.clone().sub(a);
  const m = cylinder(parent, r, delta.length(), 0, 0, 0, color);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return m;
}
function sign(scene: T.Scene, text: string, x: number, z: number) {
  cylinder(scene, 0.09, 2.4, x, 1.2, z, "#76513a");
  const tag = label(text);
  tag.position.set(x, 2.5, z);
  tag.scale.set(5.2, 0.85, 1);
  scene.add(tag);
}
function tree(scene: T.Scene, x: number, z: number, seed: number) {
  const h = 4 + (seed % 4) * 0.45;
  cylinder(scene, 0.23, h, x, h / 2, z, "#73573d");
  for (let i = 0; i < 3; i++) {
    const m = new T.Mesh(
      new T.ConeGeometry(2.5 - i * 0.4, 3, 14),
      mat(["#375d40", "#426d49", "#568057"][seed % 3]),
    );
    m.position.set(x, h - 1 + i * 1.2, z);
    scene.add(m);
  }
}
function tent(scene: T.Scene, x: number, z: number, color: string) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  const shape = new T.Shape();
  shape.moveTo(-2, 0);
  shape.lineTo(0, 2.8);
  shape.lineTo(2, 0);
  shape.closePath();
  const m = new T.Mesh(
    new T.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false }),
    mat(color),
  );
  m.position.z = -2;
  g.add(m);
  const door = new T.Mesh(new T.ShapeGeometry(shape), mat("#263f35"));
  door.scale.set(0.6, 0.8, 1);
  door.position.set(0, 0.02, 2.02);
  g.add(door);
  pole(g, new T.Vector3(0, 2.8, 2), new T.Vector3(0, 0, 4), 0.025, "#d7bf8d");
  for (const side of [-1, 1]) {
    pole(
      g,
      new T.Vector3(side * 1.5, 1, 1.5),
      new T.Vector3(side * 3, 0, 3),
      0.018,
      "#d9d1a4",
    );
    box(g, 0.15, 0.12, 0.15, side * 3, 0.06, 3, "#a78050");
  }
  box(g, 1.8, 0.06, 1.1, 0, 0.04, 2.8, "#b98a5a");
}
export function buildLobby(scene: T.Scene, vip: boolean) {
  const obstacles: Obstacle[] = buildLandscape(scene);
  // A meadow follows the camp alleys instead of a circular platform.
  const clearing=new T.Shape();
  clearing.moveTo(-42,-12);clearing.bezierCurveTo(-45,-36,-23,-40,-7,-39);clearing.bezierCurveTo(16,-42,39,-34,42,-10);clearing.bezierCurveTo(49,10,30,40,9,43);clearing.bezierCurveTo(-15,45,-44,33,-42,-12);
  const meadow=new T.Mesh(new T.ShapeGeometry(clearing,32),mat('#a0ae7c'));meadow.rotation.x=-Math.PI/2;meadow.position.y=.12;meadow.receiveShadow=true;scene.add(meadow);
  // Small groves frame the entrances, leaving every connecting alley open.
  for(const [i,x,z] of [[0,-38,-30],[1,-34,-34],[2,-15,-38],[3,17,32],[4,34,30],[5,39,-7],[6,-39,8],[7,13,-41]]){
    tree(scene,x,z,i);obstacles.push({x,z,width:.65,depth:.65,height:7,canopy:2.5});
  }
  // Fire circle, individual stones, crossed logs and warm light.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    sphere(scene, 0.33, Math.cos(a) * 2, 0.25, Math.sin(a) * 2, "#8c8b78");
  }
  for (let i = 0; i < 4; i++) {
    const log = cylinder(scene, 0.22, 3, 0, 0.4, 0, "#654735");
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i * Math.PI) / 4;
  }
  const flames = new T.Group();
  scene.add(flames);
  flames.userData.dynamic=true;
  for (let i = 0; i < 6; i++) {
    const flame = new T.Mesh(
      new T.ConeGeometry(0.5 - i * 0.055, 1.7 - i * 0.1, 7),
      new T.MeshStandardMaterial({
        color: i % 2 ? "#ffd379" : "#e99844",
        emissive: "#b55315",
        emissiveIntensity: 0.7,
      }),
    );
    flame.position.set(
      Math.sin(i * 2) * 0.5,
      1 + i * 0.05,
      Math.cos(i * 2) * 0.5,
    );
    flames.add(flame);
  }
  const firelight = new T.PointLight("#ffc276", 16, 14);
  firelight.position.y = 2;
  scene.add(firelight);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const x = Math.cos(a) * 5.5,
      z = Math.sin(a) * 5.5;
    const bench = new T.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = -a;
    scene.add(bench);
    box(bench, 0.8, 0.35, 3, 0, 0.6, 0, "#916c48");
    for (const side of [-1, 1])
      box(bench, 0.6, 0.5, 0.4, 0, 0.25, side, "#644b38");
    obstacles.push({ x, z, width: 1.4, depth: 1.4 });
  }
  obstacles.push({ x: 0, z: 0, width: 4.4, depth: 4.4 });
  tent(scene, -23, -18, "#bf8958");
  tent(scene, -31, -22, "#6c8a77");
  tent(scene, -22, -27, "#c6b083");
  for (const [x, z] of [
    [-23, -18],
    [-31, -22],
    [-22, -27],
  ])
    obstacles.push({ x, z, width: 5, depth: 5 });
  // A-frame pioneering entrance and rope practice table.
  for (const x of [19, 27]) {
    pole(
      scene,
      new T.Vector3(x, 0, -15),
      new T.Vector3(23, 6, -15),
      0.18,
      "#957249",
    );
  }
  pole(
    scene,
    new T.Vector3(19, 3, -15),
    new T.Vector3(27, 3, -15),
    0.14,
    "#957249",
  );
  box(scene, 7, 0.3, 3, 24, 1.4, -23, "#b18c60");
  for (const x of [21.5, 26.5])
    for (const z of [-24, -22])
      box(scene, 0.22, 1.4, 0.22, x, 0.7, z, "#72553b");
  for (let i = 0; i < 3; i++) {
    const rope = new T.Mesh(
      new T.TorusGeometry(0.6, 0.08, 5, 16),
      mat("#d5bb7b"),
    );
    rope.rotation.x = Math.PI / 2;
    rope.position.set(22 + i * 1.8, 1.62, -23);
    scene.add(rope);
  }
  obstacles.push({ x: 24, z: -23, width: 8, depth: 4 });
  // Lake with reeds and a walkable pier.
  const lake = new T.Mesh(
    new T.CircleGeometry(10, 48),
    new T.MeshStandardMaterial({
      color: "#669e9e",
      roughness: 0.23,
      metalness: 0.2,
    }),
  );
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(1, 1.3, 1);
  lake.position.set(-25, 0.19, 22);
  scene.add(lake);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const x = -25 + Math.cos(a) * 10,
      z = 22 + Math.sin(a) * 13;
    cylinder(scene, 0.03, 1.1, x, 0.65, z, "#698758");
  }
  for (let i = 0; i < 13; i++)
    box(scene, 4, 0.2, 0.48, -19, 0.44, 12 + i * 0.5, "#aa875d");
  obstacles.push(
    { x: -29, z: 24, width: 11, depth: 22 },
    { x: -21, z: 27, width: 7, depth: 13 },
  );
  // Telescope terrace, railings and a field notebook.
  cylinder(scene, 6, 0.5, 25, 0.25, 18, "#c2a37a", 24);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    if (Math.sin(a) < -0.7) continue;
    const x = 25 + Math.cos(a) * 5.5,
      z = 18 + Math.sin(a) * 5.5;
    cylinder(scene, 0.07, 1.4, x, 1.1, z, "#795f42");
  }
  for (const [dx, dz] of [
    [-1, 1],
    [1, 1],
    [0, -1],
  ])
    pole(
      scene,
      new T.Vector3(25 + dx, 0.6, 18 + dz),
      new T.Vector3(25, 2.5, 18),
      0.06,
      "#c4bd9e",
    );
  const scope = cylinder(scene, 0.35, 2.4, 25, 2.8, 18, "#e5deca", 16);
  scope.rotation.z = -0.85;
  scope.rotation.x = 0.4;
  obstacles.push({ x: 25, z: 18, width: 2.8, depth: 2.8 });
  // VIP lodge; solid boundary is always closed to visitors without entitlement.
  box(scene, 14, 0.6, 12, 0, 0.3, -32, "#c7ae7a");
  box(scene, 14, 4, 0.3, 0, 2, -38, "#3f6150");
  for (const x of [-7, 7]) {
    box(scene, 0.3, 4, 12, x, 2, -32, "#3f6150");
    obstacles.push({ x, z: -32, width: 0.6, depth: 12 });
  }
  for (const x of [-4.8, 4.8]) {
    box(scene, 4.4, 3, 0.3, x, 1.5, -26, "#3f6150");
    obstacles.push({ x, z: -26, width: 4.4, depth: 0.8 });
  }
  obstacles.push({ x: 0, z: -38, width: 14, depth: 0.6 });
  if (!vip) {
    box(scene, 5, 2.5, 0.25, 0, 1.25, -26, "#ba9a60");
    obstacles.push({ x: 0, z: -26, width: 5, depth: 0.8 });
  }
  box(scene, 15, 0.35, 13, 0, 4.1, -32, "#365344");
  for (const x of [-5, 5]) {
    box(scene, 2, 0.6, 4, x, 0.9, -32, "#d7bf91");
    box(scene, 2, 1, 4, x, 1.4, -33, "#b9c28b");
  }
  cylinder(scene, 1, 0.7, 0, 1, -33, "#956b48", 16);
  sphere(scene, 0.6, 0, 1.8, -33, "#d5bd72");
  for (const p of places.filter(p=>Math.hypot(p.x,p.z)<45))
    sign(
      scene,
      p.name,
      p.x + (p.id === "vip" ? 0 : 3),
      p.z + (p.id === "vip" ? 4 : 5),
    );
  // The roof stays in the world; entering the shelter brings the camera inside.
  const shelter=new T.Group();scene.add(shelter);
  for(const x of [-7,7])for(const z of [25,35]){box(shelter,.25,4,.25,x,2,z,'#765b3e');obstacles.push({x,z,width:.5,depth:.5})}
  box(shelter,15,.3,12,0,4.1,30,'#49614a');
  for(const x of [-4,4]){box(shelter,1.2,.15,6,x,.65,30,'#b1966b');for(const z of [28,32])box(shelter,.2,.6,.2,x,.3,z,'#765b3e');obstacles.push({x,z:30,width:1.4,depth:6})}
  // String lights suspended over the gathering place.
  for (const x of [-12, 12]) cylinder(scene, 0.12, 6, x, 3, 8, "#765b41");
  for (let i = 0; i < 18; i++) {
    const x = -12 + (i * 24) / 17,
      y = 5.7 - Math.sin((i / 17) * Math.PI) * 1.1;
    sphere(scene, 0.12, x, y, 8, i % 3 ? "#f8dda2" : "#c6d9b6");
  }
  const atmosphere=polishCamp(scene);batchStaticWorld(scene);
  return {
    obstacles,
    animate(time: number,camera:T.Camera,caveBlend=0) {
      atmosphere(time,camera,caveBlend);
      flames.scale.y = 1 + Math.sin(time * 7) * 0.08;
      flames.rotation.y = time * 0.2;
      firelight.intensity = 15 + Math.sin(time * 9);
    },
  };
}