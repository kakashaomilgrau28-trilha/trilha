import * as T from 'three';
import {box,label} from '../world/character';
import {SIZE,BOUNDARY,terrainHeight,trails,destinations} from './exploration';
const material=(color:string)=>new T.MeshStandardMaterial({color,roughness:.9});
function ribbon(scene:T.Scene,points:number[][],width:number,color:string,offset=.08){
 const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z))),vertices:number[]=[],indices:number[]=[];
 const steps=180;
 for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);for(const s of [-1,1]){const x=p.x+n.x*s,z=p.z+n.z*s;vertices.push(x,terrainHeight(x,z)+offset,z)}if(i<steps){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide}));scene.add(mesh);return curve;
}
export function buildLandscape(scene:T.Scene){
 const geo=new T.PlaneGeometry(SIZE+30,SIZE+30,150,150);geo.rotateX(-Math.PI/2);
 const points=geo.attributes.position,colors:number[]=[];
 for(let i=0;i<points.count;i++){const x=points.getX(i),z=points.getZ(i),h=terrainHeight(x,z);points.setY(i,h);const c=new T.Color(h>36?'#bcbfb1':h>23?'#85907b':h>12?'#7c9369':'#8ca476');c.multiplyScalar(1+Math.sin(x*.3)*Math.cos(z*.2)*.035);colors.push(c.r,c.g,c.b)}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();scene.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1})));
 const routes=trails.map(t=>({trail:t,curve:ribbon(scene,t.points,3.5,'#c7b28d')}));
 ribbon(scene,[[-138,69],[-110,55],[-83,65],[-55,83],[-5,77],[35,96],[66,122]],4,'#659c9b',.14);
 // Forests use instanced trunks and crowns: hundreds of trees with a handful of draws.
 const routeSamples=routes.flatMap(r=>r.curve.getPoints(55));
 const count=430,trunks=new T.InstancedMesh(new T.CylinderGeometry(.22,.35,4,6),material('#6c5842'),count),crowns=new T.InstancedMesh(new T.ConeGeometry(2.7,7,7),material('#456b49'),count),dummy=new T.Object3D();
 let planted=0;
 for(let i=0;planted<count&&i<5000;i++){const rnd=(v:number)=>{const n=Math.sin(v*127.1+311.7)*43758.5453;return n-Math.floor(n)};const x=(rnd(i+1)-.5)*BOUNDARY*2,z=(rnd(i+97)-.5)*BOUNDARY*2;if(Math.hypot(x,z)<47||terrainHeight(x,z)>34)continue;const close=routeSamples.some(p=>Math.hypot(p.x-x,p.z-z)<5);if(close||destinations.some(p=>Math.hypot(p.x-x,p.z-z)<10))continue;const y=terrainHeight(x,z),s=.75+rnd(i+201)*.6;dummy.position.set(x,y+2*s,z);dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(planted,dummy.matrix);dummy.position.y=y+6*s;dummy.updateMatrix();crowns.setMatrixAt(planted,dummy.matrix);crowns.setColorAt(planted,new T.Color().setHSL(.27+rnd(i+304)*.06,.22,.25+rnd(i+59)*.1));planted++}
 trunks.count=crowns.count=planted;scene.add(trunks,crowns);
 // Rest stops, trail signs and mountaintop viewing decks.
 for(const p of destinations){const group=new T.Group();group.position.set(p.x,terrainHeight(p.x,p.z),p.z);scene.add(group);box(group,.16,2.6,.16,3,1.3,3,'#796144');const tag=label(p.name);tag.position.set(3,3,3);tag.scale.set(5,.8,1);group.add(tag);
  if(p.id==='cume'||p.id==='pedras'){for(let i=0;i<12;i++)box(group,7,.2,.48,0,.15,-2.8+i*.5,'#ac8d64');for(const x of [-3.4,3.4]){box(group,.12,1.3,6,x,.8,0,'#6d583e');for(const z of [-2.6,0,2.6])box(group,.16,1.3,.16,x,.65,z,'#6d583e')}}
  if(p.id==='rio'){for(let i=0;i<14;i++)box(group,5,.18,.45,0,.6,-3+i*.45,'#aa875e');for(const x of [-2.3,2.3])box(group,.12,.12,6,x,1.6,0,'#775e40')}
  if(p.id==='refugio'){box(group,8,.25,7,0,.2,0,'#b1966b');for(const x of [-3.5,3.5])for(const z of [-3,3])box(group,.25,4,.25,x,2,z,'#765b3e');box(group,9,.35,8,0,4.1,0,'#3f624b');box(group,8,2,.2,0,1.1,-3,'#8e7655');box(group,4,.3,1.5,0,.8,-1,'#b69a70')}
 }
 // Rock clusters and wildflowers are shared geometries, spread along the trails.
 const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material('#969b89'),75);
 for(let i=0;i<75;i++){const a=i*2.399,x=-100+Math.cos(a)*(8+i%13),z=-80+Math.sin(a)*(8+i%19);dummy.position.set(x,terrainHeight(x,z)+.45,z);dummy.scale.set(1+i%3,.7+i%2,1.5);dummy.rotation.y=a;dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}scene.add(rocks);
 const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.22,0),material('#e2bd76'),150);
 for(let i=0;i<150;i++){const a=i*2.399,r=5+Math.sqrt(i)*1.5,x=89+Math.cos(a)*r,z=89+Math.sin(a)*r;dummy.position.set(x,terrainHeight(x,z)+.3,z);dummy.scale.set(1,1,1);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new T.Color(i%3===0?'#dfb6bd':i%3===1?'#f3d984':'#e4e9cd'))}scene.add(flowers);
 const falls=new T.Group();falls.position.set(-125,terrainHeight(-125,-58),-58);scene.add(falls);box(falls,5,7,2,0,3.5,-3,'#929987');box(falls,2.5,6,.2,0,3.2,-1.9,'#a3d0d0');box(falls,7,.15,5,0,.1,0,'#719f9e');
}
