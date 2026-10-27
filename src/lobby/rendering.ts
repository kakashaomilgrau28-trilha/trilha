import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** One small procedural texture per surface type, owned by this scene. */
export function surfaceTexture(kind:'ground'|'wood'|'water'|'cloth'){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d')!,data=ctx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const noise=Math.sin(x*127.1+y*311.7)*43758.5453%1;
  const grain=kind==='wood'?Math.sin(x*.35+Math.sin(y*.06)*1.5)*18:
   kind==='water'?Math.sin(x*.14+y*.18)*12+Math.cos(y*.3)*8:
   kind==='cloth'?((x%4===0||y%4===0)?-12:3):0;
  const value=Math.max(0,Math.min(255,210+noise*16+grain)),i=(y*128+x)*4;
  data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);
 const texture=new T.CanvasTexture(canvas);
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;
 texture.anisotropy=4;return texture;
}

/** Bake static objects into spatial batches. Moving objects opt out at group level. */
export function batchStaticWorld(scene:T.Scene){
 scene.updateMatrixWorld(true);
 const groups=new Map<string,{geos:T.BufferGeometry[];material:T.MeshStandardMaterial;meshes:T.Mesh[]}>();
 scene.traverse(node=>{
  if(!(node instanceof T.Mesh)||node instanceof T.InstancedMesh||Array.isArray(node.material))return;
  const mat=node.material;
  if(!(mat instanceof T.MeshStandardMaterial)||mat.transparent||mat.emissiveIntensity&&mat.emissive.getHex()!==0)return;
  for(let p:T.Object3D|null=node;p;p=p.parent)if(p.userData.dynamic||p instanceof T.LOD)return;
  if(node.geometry.getAttribute('position').count>6000)return;
  const pos=new T.Vector3().setFromMatrixPosition(node.matrixWorld);
  const key=[Math.floor(pos.x/48),Math.floor(pos.z/48),mat.roughness,mat.metalness,mat.side,mat.userData.caveWall??"",mat.map?.uuid,mat.bumpMap?.uuid].join(':');
  const geo=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();
  geo.applyMatrix4(node.matrixWorld);
  const n=geo.getAttribute('position').count,colors=new Float32Array(n*3),previous=geo.getAttribute('color');
  for(let i=0;i<n;i++){colors[i*3]=mat.color.r*(previous?.getX(i)??1);colors[i*3+1]=mat.color.g*(previous?.getY(i)??1);colors[i*3+2]=mat.color.b*(previous?.getZ(i)??1)}
  geo.setAttribute('color',new T.BufferAttribute(colors,3));
  for(const attribute of Object.keys(geo.attributes))if(!['position','normal','color','uv'].includes(attribute))geo.deleteAttribute(attribute);
  if(!geo.getAttribute('uv'))geo.setAttribute('uv',new T.BufferAttribute(new Float32Array(n*2),2));
  if(!geo.getAttribute('normal'))geo.computeVertexNormals();
  let group=groups.get(key);if(!group){const combined=mat.clone();combined.color.set(0xffffff);combined.vertexColors=true;group={geos:[],meshes:[],material:combined};groups.set(key,group)}
  group.geos.push(geo);group.meshes.push(node);
 });
 for(const group of groups.values()){
  const geometry=mergeGeometries(group.geos);group.geos.forEach(g=>g.dispose());
  if(!geometry){group.material.dispose();continue}
  geometry.computeBoundingSphere();
  const mesh=new T.Mesh(geometry,group.material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  for(const original of group.meshes){original.removeFromParent();original.geometry.dispose();(original.material as T.Material).dispose()}
 }
}

export type GraphicQuality='auto'|'economy'|'high';
export function configureRenderer(renderer:T.WebGLRenderer,quality:GraphicQuality,automaticScale=1){
 const ratio=Math.min(devicePixelRatio,quality==='high'?1.6:quality==='economy'?1:1.25)*automaticScale;
 if(Math.abs(renderer.getPixelRatio()-ratio)>.01)renderer.setPixelRatio(ratio);
 renderer.shadowMap.enabled=quality!=='economy'&&(quality==='high'||automaticScale>.8);
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.outputColorSpace=T.SRGBColorSpace;
}
