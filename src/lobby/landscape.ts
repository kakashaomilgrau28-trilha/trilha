import * as T from 'three';
import {box,label} from '../world/character';
import type {Obstacle} from '../world/physics';
import {SIZE,BOUNDARY,terrainHeight,trails,destinations,caves,ropeCrossing,EXPANSION} from './exploration';
const material=(color:string)=>new T.MeshStandardMaterial({color,roughness:.9});
function ribbon(scene:T.Scene,points:number[][],width:number,color:string,offset=.08){
 const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z))),vertices:number[]=[],indices:number[]=[];
 const steps=180;
 for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);for(const s of [-1,1]){const x=p.x+n.x*s,z=p.z+n.z*s;vertices.push(x,terrainHeight(x,z)+offset,z)}if(i<steps){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide}));scene.add(mesh);return curve;
}
export function buildLandscape(scene:T.Scene){
 const obstacles:Obstacle[]=[];
 const geo=new T.PlaneGeometry(SIZE+30,SIZE+30,220,220);geo.rotateX(-Math.PI/2);
 const points=geo.attributes.position,colors:number[]=[];
 for(let i=0;i<points.count;i++){const x=points.getX(i),z=points.getZ(i),h=terrainHeight(x,z);points.setY(i,h);const c=new T.Color(h>36?'#bcbfb1':h>23?'#85907b':h>12?'#7c9369':'#8ca476');c.multiplyScalar(1+Math.sin(x*.3)*Math.cos(z*.2)*.035);colors.push(c.r,c.g,c.b)}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();scene.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1})));
 for(const t of trails)ribbon(scene,t.points,t.width,'#c7b28d');
 ribbon(scene,[[-138,69],[-110,55],[-83,65],[-55,83],[-5,77],[35,96],[66,122]].map(([x,z])=>[x*EXPANSION,z*EXPANSION]),8,'#659c9b',.14);
 // Share deterministic tree positions with the location map.
 const forest=getForestLayout(),count=forest.length;
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.22,.35,4,6),material('#6c5842'),count),crowns=new T.InstancedMesh(new T.ConeGeometry(2.7,7,7),material('#456b49'),count),dummy=new T.Object3D();
 forest.forEach(({x,z,s,hue,lightness},i)=>{const y=terrainHeight(x,z);dummy.position.set(x,y+2*s,z);dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);obstacles.push({x,z,width:.7*s,depth:.7*s});dummy.position.y=y+6*s;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new T.Color().setHSL(hue,.22,lightness))});scene.add(trunks,crowns);
 const shrubs=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),material('#53734a'),Math.min(1800,count));
 forest.slice(0,shrubs.count).forEach(({x,z,s},i)=>{dummy.position.set(x,terrainHeight(x,z)+.65*s,z);dummy.scale.set(1.4*s,.85*s,1.4*s);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix)});scene.add(shrubs);
 // Rest stops, trail signs and mountaintop viewing decks.
 for(const p of destinations){const group=new T.Group();group.position.set(p.x,terrainHeight(p.x,p.z),p.z);scene.add(group);box(group,.16,2.6,.16,3,1.3,3,'#796144');const tag=label(p.name);tag.position.set(3,3,3);tag.scale.set(5,.8,1);group.add(tag);
  if(p.id==='cume'||p.id==='pedras'){for(let i=0;i<12;i++)box(group,7,.2,.48,0,.15,-2.8+i*.5,'#ac8d64');for(const x of [-3.4,3.4]){box(group,.12,1.3,6,x,.8,0,'#6d583e');for(const z of [-2.6,0,2.6])box(group,.16,1.3,.16,x,.65,z,'#6d583e')}}
  if(p.id==='rio'){for(let i=0;i<14;i++)box(group,5,.18,.45,0,.6,-3+i*.45,'#aa875e');for(const x of [-2.3,2.3])box(group,.12,.12,6,x,1.6,0,'#775e40')}
  if(p.id==='refugio'){box(group,8,.25,7,0,.2,0,'#b1966b');for(const x of [-3.5,3.5])for(const z of [-3,3])box(group,.25,4,.25,x,2,z,'#765b3e');box(group,9,.35,8,0,4.1,0,'#3f624b');box(group,8,2,.2,0,1.1,-3,'#8e7655');box(group,4,.3,1.5,0,.8,-1,'#b69a70')}
 }
 // Rock clusters and wildflowers are shared geometries, spread along the trails.
 const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material('#969b89'),75);
 for(let i=0;i<75;i++){const a=i*2.399,x=-100*EXPANSION+Math.cos(a)*(8+i%13),z=-80*EXPANSION+Math.sin(a)*(8+i%19);dummy.position.set(x,terrainHeight(x,z)+.45,z);dummy.scale.set(1+i%3,.7+i%2,1.5);dummy.rotation.y=a;dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}scene.add(rocks);
 const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.22,0),material('#e2bd76'),150);
 for(let i=0;i<150;i++){const a=i*2.399,r=5+Math.sqrt(i)*1.5,x=89*EXPANSION+Math.cos(a)*r,z=89*EXPANSION+Math.sin(a)*r;dummy.position.set(x,terrainHeight(x,z)+.3,z);dummy.scale.set(1,1,1);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new T.Color(i%3===0?'#dfb6bd':i%3===1?'#f3d984':'#e4e9cd'))}scene.add(flowers);
 const falls=new T.Group();falls.position.set(-125*EXPANSION,terrainHeight(-125*EXPANSION,-58*EXPANSION),-58*EXPANSION);scene.add(falls);box(falls,5,7,2,0,3.5,-3,'#929987');box(falls,2.5,6,.2,0,3.2,-1.9,'#a3d0d0');box(falls,7,.15,5,0,.1,0,'#719f9e');
 // Cave shells have walkable floors, collision walls and covered galleries.
 for(const c of caves){
  const root=new T.Group(),base=terrainHeight(c.x,c.z);root.position.set(c.x,base,c.z);scene.add(root);
  const wall=(x:number,z:number,w:number,d:number)=>{box(root,w,5,d,x,2.5,z,'#545950');obstacles.push({x:c.x+x,z:c.z+z,width:w,depth:d})};
  wall(-5,-(c.length-14)/2,1,c.length-14);
  wall(5,-19,1,38);if(c.length>62)wall(5,-(48+c.length-14)/2,1,c.length-62);
  wall(-9.5,-c.length+4,1,20);wall(9.5,-c.length+4,1,20);wall(0,-c.length-6,20,1);
  wall(18,-37.5,27,1);wall(18,-48.5,27,1);wall(31.5,-43,1,12);
  box(root,10,.8,c.length-14,0,5,-(c.length-14)/2,'#4e534c');box(root,20,.8,20,0,5,-c.length+4,'#4e534c');box(root,27,.8,12,18,5,-43,'#4e534c');
  box(root,8,.2,c.length+5,0,.05,-c.length/2,'#6d6b59');
  for(let i=0;i<14;i++){const rock=new T.Mesh(new T.IcosahedronGeometry(1.5,0),material('#656c5d'));rock.position.set((i%2?1:-1)*(5+i%3),1.5+(i%3),i<8?2:-c.length+i);rock.scale.set(1.1,1.5,1);root.add(rock)}
  for(let i=0;i<9;i++){const crystal=new T.Mesh(new T.OctahedronGeometry(.55,0),new T.MeshStandardMaterial({color:'#7aa7a4',emissive:'#45675e',emissiveIntensity:.25}));crystal.position.set(-6+i*1.5,.7,-c.length+2+i%3);root.add(crystal)}
  const tag=label(c.name+' · entre a pé');tag.position.set(0,6,4);tag.scale.set(7,1,1);root.add(tag);
 }
 const r=ropeCrossing,h=terrainHeight(r.x,r.z);box(scene,21,.15,11,r.x,h+.2,r.z,'#33483c');obstacles.push({x:r.x,z:r.z,width:20,depth:10});
 for(const x of [r.from.x,r.to.x]){box(scene,.5,2,.5,x,terrainHeight(x,r.z)+1,r.z,'#a98755');const tag=label('Ancoragem · use a corda');tag.position.set(x,terrainHeight(x,r.z)+3,r.z);scene.add(tag)}
 return obstacles;

}

type ForestTree={x:number;z:number;s:number;hue:number;lightness:number};
let forestLayout:ForestTree[]|undefined;
export function getForestLayout(){
 if(forestLayout)return forestLayout;
 const routes=trails.map(t=>({trail:t,curve:new T.CatmullRomCurve3(t.points.map(([x,z])=>new T.Vector3(x,0,z)))})),narrow=routes.filter(r=>r.trail.width<3);
 const buckets=new Map<string,T.Vector3[]>(),cell=5;
 for(const route of routes)for(const p of route.curve.getPoints(600)){const key=`${Math.floor(p.x/cell)},${Math.floor(p.z/cell)}`;const bucket=buckets.get(key)??[];bucket.push(p);buckets.set(key,bucket)}
 const closeToTrail=(x:number,z:number)=>{const cx=Math.floor(x/cell),cz=Math.floor(z/cell);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(buckets.get(`${cx+dx},${cz+dz}`)?.some(p=>(p.x-x)**2+(p.z-z)**2<2.1**2))return true;return false};
 const rnd=(v:number)=>{const n=Math.sin(v*127.1+311.7)*43758.5453;return n-Math.floor(n)},forest:ForestTree[]=[];
 for(let i=0;forest.length<6000&&i<30000;i++){
  let x=(rnd(i+1)-.5)*BOUNDARY*2,z=(rnd(i+97)-.5)*BOUNDARY*2;
  if(i<1800){const route=narrow[i%narrow.length],t=(Math.floor(i/8)+.5)/225,p=route.curve.getPoint(t),d=route.curve.getTangent(t),side=Math.floor(i/4)%2?1:-1,offset=3+rnd(i+205)*3;x=p.x-d.z*side*offset;z=p.z+d.x*side*offset}
  if(Math.abs(x)>BOUNDARY||Math.abs(z)>BOUNDARY||Math.hypot(x,z)<47||terrainHeight(x,z)>34||closeToTrail(x,z)||destinations.some(p=>Math.hypot(p.x-x,p.z-z)<12)||caves.some(c=>Math.abs(x-c.x-10)<38&&z<c.z+10&&z>c.z-c.length-20))continue;
  forest.push({x,z,s:.75+rnd(i+201)*.6,hue:.27+rnd(i+304)*.06,lightness:.25+rnd(i+59)*.1});
 }
 forestLayout=forest;return forest;
}
