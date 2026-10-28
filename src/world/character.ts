import * as THREE from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";

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
  const colors=looks[((index%looks.length)+looks.length)%looks.length],root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const mats=new Map<string,THREE.MeshStandardMaterial>();
  const mat=(color:string)=>{let m=mats.get(color);if(!m){m=material(color);m.roughness=color===colors.skin?.72:.88;mats.set(color,m)}return m};
  function rounded(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:string,r=.04){
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function oval(parent:THREE.Object3D,r:number,x:number,y:number,z:number,color:string,sx=1,sy=1,sz=1){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function limb(parent:THREE.Object3D,r:number,length:number,y:number,color:string){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,4,10),mat(color));mesh.position.y=y;mesh.castShadow=true;parent.add(mesh);return mesh}
  rounded(body,.54,.65,.31,0,1.12,0,colors.shirt,.09);
  rounded(body,.47,.17,.3,0,.81,0,'#344d46');
  oval(body,.09,0,1.48,0,colors.skin,.85,1.1,.85);
  oval(body,.23,0,1.71,0,colors.skin,.92,1.12,.94);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.242,24,12,0,Math.PI*2,0,Math.PI*.56),mat(colors.hair));hair.position.y=1.75;hair.scale.z=.96;hair.castShadow=true;body.add(hair);
  for(const side of [-1,1]){
    oval(body,.05,side*.215,1.7,0,colors.skin,.7,1,1);
    rounded(body,.07,.014,.025,side*.081,1.763,.203,colors.hair,.005);
    rounded(body,.15,.15,.035,side*.15,1.22,.16,colors.shirt,.018);
    rounded(body,.15,.025,.045,side*.15,1.28,.18,'#e0c99c',.008);
    rounded(body,.045,.48,.035,side*.2,1.18,.17,'#3e5948',.012);
  }
  const eyes=new THREE.Group();eyes.position.y=1.72;body.add(eyes);
  for(const side of [-1,1]){oval(eyes,.025,side*.077,0,.207,'#292e2a',.7,1,.45);oval(eyes,.008,side*.077-.005,.008,.219,'#fff4df',1,1,.4)}
  oval(body,.035,0,1.665,.219,colors.skin,.75,1,1.05);
  rounded(body,.075,.012,.018,0,1.604,.202,'#855347',.005);
  const scarf=rounded(body,.14,.26,.035,0,1.29,.184,'#f3cb5d',.012);scarf.rotation.z=-.22;
  rounded(body,.11,.075,.05,0,1.36,.2,'#b39252',.018);
  rounded(body,.09,.09,.025,-.14,1.35,.19,'#d8b85e',.015);
  rounded(body,.39,.48,.21,0,1.12,-.23,'#3f6353',.07);
  rounded(body,.31,.15,.07,0,1.01,-.35,'#567a60',.03);
  for(const y of [1.03,1.13,1.23])oval(body,.013,0,y,.169,'#d9ccb0');
  const legs:THREE.Group[]=[],knees:THREE.Group[]=[],arms:THREE.Group[]=[],elbows:THREE.Group[]=[];
  for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.145,.81,0);body.add(hip);legs.push(hip);
    limb(hip,.105,.20,-.17,'#334b50');
    const knee=new THREE.Group();knee.position.y=-.36;hip.add(knee);knees.push(knee);
    limb(knee,.086,.20,-.15,'#334b50');rounded(knee,.23,.14,.34,0,-.37,.065,'#323731',.045);rounded(knee,.235,.035,.35,0,-.445,.07,'#242a25',.012);
    const shoulder=new THREE.Group();shoulder.position.set(side*.32,1.39,0);body.add(shoulder);arms.push(shoulder);
    limb(shoulder,.095,.16,-.12,colors.shirt);
    const elbow=new THREE.Group();elbow.position.y=-.27;shoulder.add(elbow);elbows.push(elbow);
    limb(elbow,.069,.17,-.12,colors.skin);oval(elbow,.077,0,-.26,0,colors.skin,.85,1.1,.8);
  }
  const socket=(parent:THREE.Object3D,x:number,y:number,z:number)=>{const n=new THREE.Group();n.position.set(x,y,z);parent.add(n);return n};
  const sockets={leftHand:socket(elbows[0],0,-.27,.02),rightHand:socket(elbows[1],0,-.27,.02),head:socket(body,0,1.71,0),chest:socket(body,0,1.18,.12),leftFoot:socket(knees[0],0,-.37,.065),rightFoot:socket(knees[1],0,-.37,.065)};
  // Bake non-articulated pieces per joint into one draw, retaining vertex colours.
  const joints:THREE.Object3D[]=[body,eyes,...legs,...knees,...arms,...elbows];
  for(const joint of joints){const pieces=joint.children.filter(n=>n instanceof THREE.Mesh&&n!==scarf) as THREE.Mesh[];if(!pieces.length)continue;
    const geos=pieces.map(piece=>{piece.updateMatrix();const geo=piece.geometry.index?piece.geometry.toNonIndexed():piece.geometry.clone();geo.applyMatrix4(piece.matrix);geo.deleteAttribute('uv');const color=(piece.material as THREE.MeshStandardMaterial).color,values=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=color.r;values[i+1]=color.g;values[i+2]=color.b}geo.setAttribute('color',new THREE.BufferAttribute(values,3));return geo});
    const geo=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(geo){const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82}));mesh.castShadow=true;mesh.receiveShadow=true;joint.add(mesh);pieces.forEach(p=>{joint.remove(p);p.geometry.dispose()})}
  }
  for(const [color,m] of mats)if(color!=='#f3cb5d')m.dispose();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(18,34,24,.35)');gradient.addColorStop(1,'rgba(18,34,24,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.19;root.add(shadow);
  let previous=0,phase=0,weight=0;
  const ease=(current:number,target:number,dt:number)=>THREE.MathUtils.lerp(current,target,1-Math.exp(-14*dt));
  return {root,sockets,animate(time:number,moving:boolean,gesture='',cycling=false,motion?:{speed:number;air:number;landing:number;item?:string;action?:number;observing?:boolean;cyclePhase?:number;crossing?:boolean}){
    const dt=previous?Math.min(.1,Math.max(0,time-previous)):1/60;previous=time;
    const speed=motion?.speed??(moving?3.6:0),air=motion?.air??0,landing=motion?.landing??0;
    weight=ease(weight,moving?Math.min(1,speed/2):0,dt);phase+=speed*dt*(cycling?2.8:2.7);
    const stride=Math.sin(phase)*.62*weight,seated=!moving&&gesture==='Sentar'&&!cycling,run=speed>5&&!cycling;
    for(let i=0;i<2;i++){const sign=i===0?1:-1,swing=stride*sign,oldArmX=arms[i].rotation.x,oldElbowX=elbows[i].rotation.x;
      legs[i].rotation.x=ease(legs[i].rotation.x,seated?-1.35:cycling?-.65+swing*.6:air>.1?-.25+swing*.15:swing,dt);
      knees[i].rotation.x=ease(knees[i].rotation.x,seated?1.3:cycling?1.1-swing*.75:air>.1?.65:Math.max(0,-Math.sin(phase+(i?Math.PI:0)))*weight*(run?1:.65)+landing*.35,dt);
      arms[i].rotation.x=ease(arms[i].rotation.x,cycling?-1.03:seated?-.25:-swing*(run?1.05:.65),dt);
      elbows[i].rotation.x=ease(elbows[i].rotation.x,cycling?-.35:run?-.7:-.15,dt);
      const held=motion?.item??'';
      if(!cycling&&['mapa','binoculos','lanterna','cantil','corda','bussola'].includes(held)){
       const two=held==='mapa'||held==='binoculos',hand=i===1;
       if(two||hand){
        let shoulder=two?-.9:-.7,elbow=two?-.65:-.25;
        if(held==='binoculos'&&motion?.observing){shoulder=-1.55;elbow=-1.55;}
        if(held==='cantil'&&motion?.action){shoulder=-.5;elbow=-.3-motion.action*1.8;}
        if(held==='corda'&&motion?.crossing){shoulder=-1.1;elbow=-.3;}
        arms[i].rotation.x=ease(oldArmX,shoulder,dt);elbows[i].rotation.x=ease(oldElbowX,elbow,dt);
       }
      }
      if(cycling&&motion?.cyclePhase!==undefined){
       const t=motion.cyclePhase+(i?Math.PI:0),fy=.55+Math.sin(t)*.17,fz=Math.cos(t)*.17;
       const dy=fy-1.08,d=Math.min(.71,Math.max(.1,Math.hypot(dy,fz))),l=.36;
       legs[i].rotation.x=Math.atan2(-fz,-dy)-Math.acos(Math.min(1,d/(2*l)));
       knees[i].rotation.x=Math.PI-Math.acos(Math.max(-1,Math.min(1,(2*l*l-d*d)/(2*l*l))));
      }
      const raised=gesture==='Celebrar'||(gesture==='Acenar'&&i===1);
      arms[i].rotation.z=ease(arms[i].rotation.z,raised?(i? -1:1)*(2.3+Math.sin(time*7)*.18):(i?-.07:.07),dt);
    }
    body.position.y=ease(body.position.y,(seated?-.39:cycling?.27:Math.abs(Math.sin(phase))*weight*(run?.055:.025)+Math.sin(time*2.2)*.009)-landing*.11,dt);
    body.rotation.x=ease(body.rotation.x,cycling?.18:run?.065:0,dt);body.rotation.z=Math.sin(phase)*weight*(cycling?.012:.018);
    scarf.rotation.x=Math.sin(phase+.5)*weight*.13;eyes.scale.y=Math.sin(time*.7)> .996?.12:1;
    shadow.position.y=.19-air;shadow.scale.setScalar(1+Math.min(air,.8)*.3);shadow.material.opacity=1-Math.min(air*.2,.6);
  }};
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
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  scene.traverse(node=>{
    if(node instanceof THREE.Mesh||node instanceof THREE.Points||node instanceof THREE.Line||node instanceof THREE.Sprite){
      if(node instanceof THREE.Mesh||node instanceof THREE.Points||node instanceof THREE.Line)geometries.add(node.geometry);
      for(const mat of Array.isArray(node.material)?node.material:[node.material]){materials.add(mat);for(const value of Object.values(mat))if(value instanceof THREE.Texture)textures.add(value)}
    }
  });
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
