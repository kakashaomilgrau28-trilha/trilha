import * as T from 'three';
import {surfaceTexture} from './rendering';

export function polishCamp(scene:T.Scene){
 const wood=surfaceTexture('wood'),cloth=surfaceTexture('cloth'),water=surfaceTexture('water'),stone=surfaceTexture('ground'),turf=surfaceTexture('ground');
 turf.repeat.set(32,32);
 stone.repeat.set(4,4);
 wood.repeat.set(2,4);cloth.repeat.set(6,6);water.repeat.set(7,7);
 const woodColors=new Set(['916c48','644b38','654735','765b41','aa875d','b18c60','72553b','796144','ac8d64','aa875e','b1966b','765b3e','8e7655','b69a70']);
 const clothColors=new Set(['bf8958','6c8a77','c6b083']);
 scene.traverse(node=>{
  if(!(node instanceof T.Mesh)||Array.isArray(node.material)||!(node.material instanceof T.MeshStandardMaterial))return;
  const m=node.material,color=m.color.getHexString();
  if(['a0ae7c','cfbd97','cdbb94','d2be94'].includes(color)){m.map=turf;m.bumpMap=turf;m.bumpScale=.018}
  if(woodColors.has(color)){m.map=wood;m.bumpMap=wood;m.bumpScale=.025}
  if(['545950','4e534c','656c5d','6d6b59'].includes(color)){m.map=stone;m.bumpMap=stone;m.bumpScale=.15;m.roughness=.96}
  if(clothColors.has(color)){m.map=cloth;m.bumpMap=cloth;m.bumpScale=.018}
  if(color==='669e9e'||color==='659c9b'){m.bumpMap=water;m.bumpScale=.12;m.roughness=.24;m.metalness=.18;node.userData.dynamic=true;node.receiveShadow=true}
 });
 const skyGeo=new T.SphereGeometry(1800,24,12),skyColors=[];
 const top=new T.Color('#86afc4'),horizon=new T.Color('#e7dfc2');
 for(let i=0;i<skyGeo.attributes.position.count;i++){const f=Math.max(0,skyGeo.attributes.position.getY(i)/1800),c=horizon.clone().lerp(top,Math.pow(f,.6));skyColors.push(c.r,c.g,c.b)}
 skyGeo.setAttribute('color',new T.Float32BufferAttribute(skyColors,3));
 const sky=new T.Mesh(skyGeo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,depthWrite:false,fog:false}));sky.userData.dynamic=true;sky.renderOrder=-10;scene.add(sky);
 const positions=new Float32Array(36*3),sparksGeo=new T.BufferGeometry();sparksGeo.setAttribute('position',new T.BufferAttribute(positions,3));
 const sparks=new T.Points(sparksGeo,new T.PointsMaterial({color:'#f8cb7a',size:.055,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending}));sparks.frustumCulled=false;scene.add(sparks);
 const ripples=new T.Group();ripples.userData.dynamic=true;scene.add(ripples);
 for(let i=0;i<3;i++){const ring=new T.Mesh(new T.RingGeometry(1,1.025,48),new T.MeshBasicMaterial({color:'#d6e3c9',transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(-27,.215+i*.002,23);ripples.add(ring)}
 // Small instanced tufts enrich clearings without covering the camp paths.
 const grassGeometry=new T.BufferGeometry();
 grassGeometry.setAttribute('position',new T.Float32BufferAttribute([-.035,0,0,.035,0,0,.06,.30,.025,0,0,-.035,0,0,.035,.025,.26,.06,-.09,0,0,-.035,0,0,-.11,.23,-.02],3));grassGeometry.computeVertexNormals();
 const grassMaterial=new T.MeshStandardMaterial({color:'#ffffff',side:T.DoubleSide,roughness:1});
 const grass=new T.InstancedMesh(grassGeometry,grassMaterial,1600),dummy=new T.Object3D();let planted=0;
 for(let i=0;i<5000&&planted<1600;i++){
  const x=Math.sin(i*127.1)*39,z=Math.cos(i*311.7)*39;
  if(Math.hypot(x,z)>39||Math.hypot(x,z)<13||Math.abs(x)<4.5||Math.abs(z)<4||Math.abs(z-18)<2.8||Math.abs(z+18)<2.8||(x<-13&&z>9)||(z<-24&&Math.abs(x)<9))continue;
  dummy.position.set(x,.17,z);dummy.rotation.y=i*2.4;dummy.scale.setScalar(.55+(i%7)*.11);dummy.updateMatrix();grass.setMatrixAt(planted,dummy.matrix);grass.setColorAt(planted,new T.Color(i%4===0?'#c2c58c':'#a5b67d'));planted++;
 }
 grass.count=planted;grass.computeBoundingSphere();grass.receiveShadow=true;scene.add(grass);
 const cableCurve=new T.CatmullRomCurve3([new T.Vector3(-12,5.7,8),new T.Vector3(0,4.6,8),new T.Vector3(12,5.7,8)]);
 const cable=new T.Mesh(new T.TubeGeometry(cableCurve,32,.025,5,false),new T.MeshStandardMaterial({color:'#675b3f',roughness:.9}));scene.add(cable);
 return (time:number,camera:T.Camera,caveBlend:number)=>{
  sky.position.copy(camera.position);sky.visible=caveBlend<.85;water.offset.set(time*.008,time*.003);
  for(let i=0;i<36;i++){const t=(time*.35+i/36)%1;positions[i*3]=Math.sin(i*12.4+time*.6)*(.25+t*.6);positions[i*3+1]=.65+t*2.4;positions[i*3+2]=Math.cos(i*4.6+time*.5)*(.2+t*.4)}
  sparksGeo.attributes.position.needsUpdate=true;
  ripples.children.forEach((child,i)=>{const mesh=child as T.Mesh<T.RingGeometry,T.MeshBasicMaterial>,t=(time*.16+i/3)%1;mesh.scale.setScalar(.7+t*3);mesh.material.opacity=(1-t)*.18});
  const wind=scene.userData.wind as {value:number}|undefined;if(wind)wind.value=time;
 };
}
