import * as THREE from "three";

export const looks = [
  { shirt: "#d59b57", skin: "#bb825b", hair: "#332921" },
  { shirt: "#7199a5", skin: "#e2b38d", hair: "#49312b" },
  { shirt: "#66917a", skin: "#805337", hair: "#211e20" },
  { shirt: "#bf7f74", skin: "#b97d55", hair: "#322421" },
  { shirt: "#9380b4", skin: "#e3b590", hair: "#633b26" },
  { shirt: "#be945a", skin: "#724d39", hair: "#201d1b" },
];
export function material(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
}
export function box(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  color: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material(color),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function person(index: number) {
  const colors = looks[index % looks.length];
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  box(body, 0.53, 0.65, 0.28, 0, 1.12, 0, colors.shirt);
  box(body, 0.48, 0.12, 0.3, 0, 0.82, 0, "#344d46");
  box(body, 0.13, 0.12, 0.16, 0, 1.48, 0, colors.skin);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 16, 12),
    material(colors.skin),
  );
  head.scale.set(0.9, 1.1, 0.9);
  head.position.y = 1.71;
  body.add(head);
  head.castShadow = true;
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    material(colors.hair),
  );
  hair.position.y = 1.76;
  body.add(hair);
  for (const x of [-0.08, 0.08])
    box(body, 0.035, 0.04, 0.025, x, 1.72, 0.19, "#252b28");
  box(body, 0.065, 0.06, 0.06, 0, 1.65, 0.2, colors.skin);
  box(body, 0.09, 0.02, 0.025, 0, 1.58, 0.18, "#855347");
  // Yellow scarf and backpack, with articulated limb pivots.
  const scarf = box(body, 0.15, 0.27, 0.035, 0, 1.3, 0.165, "#f3cb5d");
  scarf.rotation.z = -0.25;
  box(body, 0.37, 0.46, 0.18, 0, 1.13, -0.22, "#3f6353");
  // Uniform seams, pockets, scarf ring, badges, backpack straps and boot soles.
  box(body, 0.018, 0.55, 0.012, 0, 1.13, 0.15, "#b8a17a");
  for (const side of [-1, 1]) {
    box(body, 0.15, 0.16, 0.03, side * 0.15, 1.21, 0.16, colors.shirt);
    box(body, 0.15, 0.025, 0.04, side * 0.15, 1.28, 0.18, "#e0c99c");
    box(body, 0.045, 0.5, 0.045, side * 0.2, 1.17, 0.17, "#3e5948");
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 6),
      material(colors.skin),
    );
    ear.position.set(side * 0.21, 1.7, 0);
    body.add(ear);
  }
  box(body, 0.12, 0.09, 0.05, 0, 1.35, 0.2, "#b39252");
  box(body, 0.09, 0.09, 0.025, -0.14, 1.34, 0.19, "#d8b85e");
  box(body, 0.31, 0.15, 0.07, 0, 1.01, -0.33, "#567a60");
  for (const y of [1.03, 1.13, 1.23])
    box(body, 0.025, 0.025, 0.02, 0, y, 0.17, "#d9ccb0");
  const legs: THREE.Group[] = [],
    arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.145, 0.8, 0);
    body.add(leg);
    box(leg, 0.21, 0.63, 0.23, 0, -0.31, 0, "#334b50");
    box(leg, 0.23, 0.14, 0.34, 0, -0.73, 0.05, "#292c2a");
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.36, 1.4, 0);
    body.add(arm);
    box(arm, 0.18, 0.3, 0.22, 0, -0.14, 0, colors.shirt);
    box(arm, 0.14, 0.3, 0.17, 0, -0.43, 0, colors.skin);
    arms.push(arm);
  }
  return {
    root,
    animate(time: number, moving: boolean, gesture = "") {
      const stride = moving ? Math.sin(time * 10) * 0.65 : 0;
      legs[0].rotation.x = stride;
      legs[1].rotation.x = -stride;
      arms[0].rotation.x = -stride;
      arms[1].rotation.x = stride;
      body.position.y = moving
        ? Math.abs(Math.sin(time * 10)) * 0.045
        : Math.sin(time * 2) * 0.012;
      arms[1].rotation.z =
        gesture === "Acenar" || gesture === "Celebrar"
          ? -2.3 + Math.sin(time * 8) * 0.25
          : 0;
      arms[0].rotation.z =
        gesture === "Celebrar" ? 2.3 + Math.sin(time * 8) * 0.25 : 0;
      if (gesture === "Sentar") {
        body.position.y = -0.5;
        legs[0].rotation.x = legs[1].rotation.x = -1.4;
      }
    },
  };
}

export function label(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(24,48,40,.88)";
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 96, 24);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "600 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 48, 480);
  const map = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map, depthTest: true }),
  );
  sprite.scale.set(3.5, 0.65, 1);
  return sprite;
}

export function disposeScene(scene: THREE.Object3D) {
  scene.traverse((node) => {
    if (node instanceof THREE.Mesh || node instanceof THREE.Sprite) {
      if (node instanceof THREE.Mesh) node.geometry.dispose();
      for (const mat of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        if ("map" in mat && mat.map instanceof THREE.Texture) mat.map.dispose();
        mat.dispose();
      }
    }
  });
}
