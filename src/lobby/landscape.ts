import * as T from 'three';
import {biomeAt,biomeColor} from './biomes';
import {nodes,camps,landmarks} from './expeditionData';
import {buildCaverns} from './caverns';
import {buildForest} from './forest';
import {surfaceTexture} from './rendering';
import {box,label} from '../world/character';
import type {Obstacle} from '../world/physics';
import {SIZE,BOUNDARY,terrainHeight,surfaceHeight,caveRoofAt,riverPoints,trails,destinations,caves,ropeCrossing} from './exploration';
const material=(color:string)=>new T.MeshStandardMaterial({color,roughness:.9});
function ribbon(scene:T.Scene,points:number[][],width:number,color:string,offset=.08){
 const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z))),vertices:number[]=[],indices:number[]=[];
 const steps=360;
 for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);for(const s of [-1,1]){const x=p.x+n.x*s,z=p.z+n.z*s;vertices.push(x,terrainHeight(x,z)+offset,z)}if(i<steps){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));scene.add(mesh);return curve;
}
export function buildLandscape(scene:T.Scene){
 const obstacles:Obstacle[]=[];
 const groundTexture=surfaceTexture('ground');groundTexture.repeat.set(18,18);
 const groundMaterial=new T.MeshStandardMaterial({vertexColors:true,map:groundTexture,bumpMap:groundTexture,bumpScale:.09,roughness:1});
 const caveRoofs=buildCaverns(scene,obstacles);scene.userData.caveRoofs=caveRoofs;
 const tiles=16,width=(SIZE+30)/tiles;
 for(let tz=0;tz<tiles;tz++)for(let tx=0;tx<tiles;tx++){
  const cx=(tx+.5)*width-(SIZE+30)/2,cz=(tz+.5)*width-(SIZE+30)/2;
  const nearCave=caves.some(c=>Math.abs(cx-c.x)<width/2+20 && cz>c.z-c.length-width/2-15 && cz<c.z+width/2+5),segments=nearCave?64:20;
  const geo=new T.PlaneGeometry(width,width,segments,segments);geo.rotateX(-Math.PI/2);
  const points=geo.attributes.position,colors:number[]=[];
  for(let i=0;i<points.count;i++){const x=points.getX(i)+cx,z=points.getZ(i)+cz,h=surfaceHeight(x,z);points.setY(i,h);const c=new T.Color(biomeColor(x,z,h));c.multiplyScalar(1+Math.sin(x*.3)*Math.cos(z*.2)*.035);colors.push(c.r,c.g,c.b)}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const visible:number[]=[],covered=new Map<string,number[]>(),index=geo.index!;
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)],x=ids.reduce((n,j)=>n+points.getX(j),0)/3+cx,z=ids.reduce((n,j)=>n+points.getZ(j),0)/3+cz,c=caveRoofAt(x,z);
   if(c){const list=covered.get(c.id)??[];list.push(...ids);covered.set(c.id,list)}else visible.push(...ids);
  }
  for(const [id,indices] of covered){const patch=geo.clone();patch.setIndex(indices);patch.computeBoundingSphere();const ceiling=groundMaterial.clone();ceiling.side=T.DoubleSide;const mesh=new T.Mesh(patch,ceiling);mesh.position.set(cx,0,cz);mesh.receiveShadow=true;caveRoofs.get(id)!.add(mesh)}
  geo.setIndex(visible);geo.computeBoundingSphere();const tile=new T.Mesh(geo,groundMaterial);tile.position.set(cx,0,cz);tile.receiveShadow=true;tile.userData.dynamic=true;scene.add(tile);
 }
 for(const t of trails)ribbon(scene,t.points,t.width,t.width>=4?'#b8a485':'#c7b28d',t.name.startsWith('Alameda')||t.name==='Caminho do lago'||t.name==='Caminho dos pioneiros'?.17:.08);
 ribbon(scene,riverPoints,8,'#659c9b',.14);
 // Cell-based instancing and three distance levels let the GPU skip distant forest.
 const forest=getForestLayout();buildForest(scene,forest);
 forest.forEach(({x,z,s})=>obstacles.push({x,z,width:.7*s,depth:.7*s,height:(biomeAt(x,z).id==='savanna'?6.3:9.5)*s,canopy:(biomeAt(x,z).id==='savanna'?4:3.2)*s}));
 const dummy=new T.Object3D();
 // Rest stops, trail signs and mountaintop viewing decks.
 for(const p of destinations.filter(p=>!caves.some(c=>c.id===p.id))){const group=new T.Group();group.position.set(p.x,terrainHeight(p.x,p.z),p.z);scene.add(group);box(group,.16,2.6,.16,3,1.3,3,'#796144');const tag=label(p.name);tag.position.set(3,3,3);tag.scale.set(5,.8,1);group.add(tag);
  if(p.id==='cume'||p.id==='pedras'){for(let i=0;i<12;i++)box(group,7,.2,.48,0,.15,-2.8+i*.5,'#ac8d64');for(const x of [-3.4,3.4]){box(group,.12,1.3,6,x,.8,0,'#6d583e');for(const z of [-2.6,0,2.6])box(group,.16,1.3,.16,x,.65,z,'#6d583e')}}
  if(p.id==='rio'){group.rotation.y=2;for(let i=0;i<30;i++)box(group,4,.16,.45,0,.27,-7.2+i*.5,'#aa875e');for(const x of [-1.9,1.9]){box(group,.12,.12,15,x,1.4,0,'#775e40');for(const z of [-7,0,7])box(group,.14,1.4,.14,x,.7,z,'#775e40')}}
  if(p.id==='refugio'){box(group,8,.25,7,0,.2,0,'#b1966b');for(const x of [-3.5,3.5])for(const z of [-3,3])box(group,.25,4,.25,x,2,z,'#765b3e');box(group,9,.35,8,0,4.1,0,'#3f624b');box(group,8,2,.2,0,1.1,-3,'#8e7655');box(group,4,.3,1.5,0,.8,-1,'#b69a70')}
 }
 // Rock clusters and wildflowers are shared geometries, spread along the trails.
 const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),material('#969b89'),75);
 for(let i=0;i<75;i++){const a=i*2.399,x=-245+Math.cos(a)*(8+i%13),z=-255+Math.sin(a)*(8+i%19);dummy.position.set(x,terrainHeight(x,z)+.45,z);dummy.scale.set(1+i%3,.7+i%2,1.5);dummy.rotation.y=a;dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}scene.add(rocks);
 const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.22,0),material('#e2bd76'),150);
 for(let i=0;i<150;i++){const a=i*2.399,r=5+Math.sqrt(i)*1.5,x=-160+Math.cos(a)*r,z=245+Math.sin(a)*r;dummy.position.set(x,terrainHeight(x,z)+.3,z);dummy.scale.set(1,1,1);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new T.Color(i%3===0?'#dfb6bd':i%3===1?'#f3d984':'#e4e9cd'))}scene.add(flowers);
 const falls=new T.Group();falls.position.set(-220,terrainHeight(-220,-130),-130);scene.add(falls);box(falls,5,7,2,0,3.5,-3,'#929987');box(falls,2.5,6,.2,0,3.2,-1.9,'#a3d0d0');box(falls,7,.15,5,0,.1,0,'#719f9e');
 const r=ropeCrossing;obstacles.push({x:r.x,z:r.z,width:20,depth:10});
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2,x=r.x+Math.cos(a)*11,z=r.z+Math.sin(a)*7;const rock=new T.Mesh(new T.IcosahedronGeometry(1,1),material('#727966'));rock.position.set(x,terrainHeight(x,z)-.4,z);rock.scale.set(2.1,1.7,1.2);scene.add(rock)}
 for(const x of [r.from.x,r.to.x]){for(const side of[-1,1])box(scene,.3,2.3,.3,x,terrainHeight(x,r.z)+1.15,r.z+side*1.6,'#a98755');box(scene,.4,.25,3.5,x,terrainHeight(x,r.z)+2.2,r.z,'#a98755');const tag=label('Ancoragem · use a corda');tag.position.set(x,terrainHeight(x,r.z)+3,r.z);scene.add(tag)}
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
  const biome=biomeAt(x,z);if(rnd(i+901)>biome.trees)continue;
  if(nodes.some(n=>Math.hypot(n.x-x,n.z-z)<7)||camps.some(n=>Math.hypot(n.x-x,n.z-z)<11)||landmarks.some(n=>Math.hypot(n.x-x,n.z-z)<10))continue;
  if(Math.abs(x)>BOUNDARY||Math.abs(z)>BOUNDARY||Math.hypot(x,z)<48||terrainHeight(x,z)>34||(Math.abs(x-ropeCrossing.x)<24&&Math.abs(z-ropeCrossing.z)<13)||closeToTrail(x,z)||riverPoints.some(p=>Math.hypot(p[0]-x,p[1]-z)<12)||destinations.some(p=>Math.hypot(p.x-x,p.z-z)<12)||caves.some(c=>Math.abs(x-c.x-10)<38&&z<c.z+10&&z>c.z-c.length-20))continue;
  forest.push({x,z,s:.75+rnd(i+201)*.6,hue:.27+rnd(i+304)*.06,lightness:.25+rnd(i+59)*.1});
 }
 forestLayout=forest;return forest;
}
