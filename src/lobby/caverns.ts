import * as T from 'three';
import {caves,caveRoute,caveRoofAt,caveFloor,terrainHeight,surfaceHeight} from './exploration';
import type {Obstacle} from '../world/physics';

/** Galleries are a continuous natural rock formation. The camera enters below the intact roof. */
export function buildCaverns(scene:T.Scene,obstacles:Obstacle[]){
 const roofs=new Map<string,T.Group>();
 const stone=new T.MeshStandardMaterial({color:'#777b69',roughness:1,flatShading:true});
 const geo=new T.IcosahedronGeometry(1,1);
 for(const c of caves){
  const roof=new T.Group();roof.userData.dynamic=true;roofs.set(c.id,roof);scene.add(roof);
  const rock=(x:number,z:number,sx:number,sy:number,sz:number,y?:number)=>{
   const m=new T.Mesh(geo.clone(),stone.clone());m.position.set(x,y??caveFloor(c,z)+sy*.58,z);m.scale.set(sx,sy,sz);m.rotation.y=x*.37+z*.13;(m.material as T.Material).userData.caveWall=c.id;m.castShadow=m.receiveShadow=true;scene.add(m);return m;
  };
  const route=caveRoute(c),curve=new T.CatmullRomCurve3(route.map(([x,z])=>new T.Vector3(x,0,z)),false,'centripetal');
  // Hand-built rough sidewalls follow the same centerline as movement and atlas.
  const steps=Math.ceil(c.length/1.8);
  for(let i=0;i<=steps;i++){
   const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),last=Math.hypot(p.x-c.x,p.z-(c.z-c.length+4));
   if(last<10)continue;
   for(const side of [-1,1]){const x=p.x-d.z*side*5,z=p.z+d.x*side*5;
    rock(x,z,1.4,2.5+(i%3)*.4,1.65);obstacles.push({x,z,width:1.8,depth:1.8});
   }
  }
  const chamberZ=c.z-c.length+4;
  for(let i=0;i<35;i++){const a=i/35*Math.PI*2,x=c.x+Math.cos(a)*10.6,z=chamberZ+Math.sin(a)*10.6;if(z>chamberZ+7.5&&Math.abs(x-c.x)<5.8)continue;rock(x,z,1.55,2.7+(i%3)*.3,1.7);obstacles.push({x,z,width:1.9,depth:1.9})}
  // Walkable organic floor, recessed below the mountain surface.
  const verts:number[]=[],indices:number[]=[];
  const size=2,w=52,h=c.length+34;
  for(let z=c.z-h;z<c.z+2;z+=size)for(let x=c.x-w/2;x<c.x+w/2;x+=size){if(caveRoofAt(x+size/2,z+size/2)?.id!==c.id)continue;const n=verts.length/3;for(const [dx,dz]of[[0,0],[size,0],[0,size],[size,size]])verts.push(x+dx,caveFloor(c,z+dz)+.05,z+dz);indices.push(n,n+2,n+1,n+1,n+2,n+3)}
  const floorGeo=new T.BufferGeometry();floorGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));floorGeo.setIndex(indices);floorGeo.computeVertexNormals();const floor=new T.Mesh(floorGeo,new T.MeshStandardMaterial({color:'#716f5b',roughness:1}));floor.receiveShadow=true;scene.add(floor);
  // A broken stone arch, open at human height and merged into the hillside.
  for(let i=0;i<=10;i++){const a=i/10*Math.PI,x=c.x+Math.cos(a)*6.1,y=caveFloor(c,c.z)+Math.sin(a)*5.8;roof.add(rock(x,c.z-1,1.6,1.35,2.3,y+1))}
  for(let i=0;i<12;i++){const side=i%2?1:-1,x=c.x+side*(8+(i%3)*3),z=c.z-4-i*2;roof.add(rock(x,z,3.2,2.6,3.5,surfaceHeight(x,z)+.5))}
  // Crystal veins and stalagmites reward a lit exploration of the chamber.
  for(let i=0;i<12;i++){const a=i*2.4,x=c.x+Math.cos(a)*7.6,z=chamberZ+Math.sin(a)*7.6;
   const crystal=new T.Mesh(new T.ConeGeometry(.25+(i%3)*.1,1.5,5),new T.MeshStandardMaterial({color:'#8caeaa',emissive:'#42665c',emissiveIntensity:.18,roughness:.4}));crystal.position.set(x,caveFloor(c,z)+.65,z);crystal.rotation.z=(i%3-1)*.25;scene.add(crystal);
  }
  // Sparse cairns lead from the trail to the opening rather than a floating sign.
  for(const side of [-1,1])for(let i=0;i<3;i++)rock(c.x+side*7,c.z+8,1-i*.2,.35,1-i*.2,terrainHeight(c.x+side*7,c.z+8)+.35+i*.45);
 }
 geo.dispose();stone.dispose();
 return roofs;
}

