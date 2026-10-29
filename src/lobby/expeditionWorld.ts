import * as T from 'three';
import {person,label} from '../world/character';
import {terrainHeight,BOUNDARY} from './exploration';
import {biomes,worldClimate} from './biomes';
import {nodes,camps,landmarks} from './expeditionData';
import {available,type Expedition} from './survival';
import {createFauna,stepFauna,type Animal} from './fauna';
import {stepPosition,type Obstacle} from '../world/physics';
function animalModel(a:Animal){
 const root=new T.Group(),parts:T.Object3D[]=[],sp=a.species;
 const mat=new T.MeshStandardMaterial({color:sp.color,roughness:.95});
 const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number,c?:string)=>{const m=new T.Mesh(new T.SphereGeometry(1,10,7),c?new T.MeshStandardMaterial({color:c,roughness:.95}):mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m};
 const leg=(x:number,z:number)=>{const g=new T.Group();g.position.set(x,.65,z);const m=new T.Mesh(new T.CylinderGeometry(.07,.09,.6,7),mat);m.position.y=-.3;g.add(m);root.add(g);parts.push(g)};
 if(sp.shape==='fish'){oval(0,.15,0,.12,.15,.28);const fin=new T.Mesh(new T.ConeGeometry(.15,.2,3),mat);fin.rotation.x=Math.PI/2;fin.position.set(0,.15,-.3);root.add(fin);for(const side of[-1,1])oval(side*.08,.21,.15,.018,.018,.018,'#242b24')}
 else if(sp.shape==='snake'){for(let i=0;i<9;i++){const m=oval(Math.sin(i*.8)*.18,.09,-i*.13,.12,.09,.16);parts.push(m)}oval(0,.13,.13,.14,.1,.17);}
 else if(sp.shape==='spider'||sp.shape==='insect'){oval(0,.15,0,.16,.13,.24);for(let i=0;i<8;i++){const angle=i/8*Math.PI*2;const m=oval(Math.sin(angle)*.25,.1,Math.cos(angle)*.25,.035,.035,.22);m.rotation.y=angle;parts.push(m)}if(sp.id==='scorpion'){for(let i=0;i<4;i++)oval(0,.18+i*.08,-.2-i*.04,.06,.07,.06)}}
 else if(sp.shape==='croc'||sp.shape==='seal'){oval(0,.3,0,.32,.24,.9);oval(0,.28,.85,.24,.15,.42);oval(0,.22,-1,.13,.13,.6);for(const side of [-1,1])for(const z of[-.4,.4])oval(side*.4,.17,z,.3,.07,.2);if(sp.shape==='croc')for(let i=0;i<8;i++)oval(0,.54,-.7+i*.18,.06,.08,.06,'#3f5038')}
 else{const bear=sp.shape==='bear',ele=sp.shape==='elephant',hippo=sp.shape==='hippo';oval(0,ele?1:.75,0,ele?.55:hippo?.5:bear?.4:.27,ele?.65:hippo?.4:bear?.45:.3,ele?.8:.6);oval(0,ele?1.35:1.05,.6,ele?.42:hippo?.4:bear?.3:.22,ele?.5:.26,ele?.4:.3);oval(0,ele?1.1:1,.88,hippo?.38:.15,.13,.2);for(const side of[-1,1]){oval(side*(ele?.4:.17),ele?1.4:1.25,.6,ele?.28:.08,ele?.35:.1,.07);oval(side*.12,ele?1.4:1.12,.83,.025,.025,.025,'#242b24');for(const z of[-.4,.4])leg(side*(ele?.38:.2),z)}
  if(ele){for(let i=0;i<5;i++)oval(0,1.2-i*.15,.94+i*.035,.11,.15,.1);for(const side of[-1,1])oval(side*.2,1.05,1,.04,.04,.24,'#e0ddc9')}
  else{const tail=oval(0,.65,-.8,.06,.06,.4);tail.rotation.x=.3;parts.push(tail)}
  if(sp.id==='lion')oval(0,1.05,.5,.35,.34,.28,'#79603e');
  if(sp.id==='jaguar'||sp.id==='hyena'||sp.id==='lynx')for(let i=0;i<14;i++)oval((i%2?1:-1)*.26,.75+(i%3)*.1,-.45+Math.floor(i/2)*.14,.035,.04,.045,'#493e2e');
 }
 root.scale.setScalar(sp.size);return {root,parts};
}
export function buildExpeditionWorld(scene:T.Scene,actor:{root:T.Object3D;sockets:{rightHand:T.Group}}){
 const animals=createFauna(),models=animals.map(a=>animalModel(a));for(const m of models)scene.add(m.root);const cubs=animals.map(a=>{if(!a.cub)return null;const model=animalModel(a);model.root.scale.multiplyScalar(.35);scene.add(model.root);return model});
 const resourceModels=nodes.map(n=>{const root=new T.Group();root.position.set(n.x,terrainHeight(n.x,n.z),n.z);scene.add(root);const c=n.kind==='water'||n.kind==='fish'?'#77aeb3':n.kind==='wood'?'#8b6e48':n.kind==='stone'?'#8d9489':n.kind==='herb'?'#6e9b6a':n.kind==='fruit'?'#ba7850':'#b6b17a';
 if(n.kind==='water'||n.kind==='fish'){const pond=new T.Mesh(new T.CircleGeometry(n.kind==='fish'?5:2,24),new T.MeshStandardMaterial({color:c,roughness:.2,metalness:.15}));pond.rotation.x=-Math.PI/2;pond.position.y=.15;root.add(pond);if(n.biome==='ice'){(pond.material as T.MeshStandardMaterial).color.set('#b7d6dd');(pond.material as T.MeshStandardMaterial).roughness=.08;for(let i=0;i<5;i++){const crack=new T.Mesh(new T.BoxGeometry(.035,.015,3),new T.MeshStandardMaterial({color:'#667f85'}));crack.position.set(Math.sin(i)*1.7,.17,Math.cos(i)*1.7);crack.rotation.y=i*1.7;root.add(crack)}}const rim=new T.Mesh(new T.TorusGeometry(n.kind==='fish'?5:2,.15,5,24),new T.MeshStandardMaterial({color:'#9a9d87'}));rim.rotation.x=Math.PI/2;root.add(rim)}else for(let i=0;i<3;i++){const m=new T.Mesh(n.kind==='wood'?new T.CylinderGeometry(.12,.14,1.5,7):new T.IcosahedronGeometry(n.kind==='stone'?.45:.25,0),new T.MeshStandardMaterial({color:c}));m.position.set(i*.35-.35,.25,Math.sin(i)*.25);if(n.kind==='wood')m.rotation.z=1.4;root.add(m)}return {n,root}});
 for(const b of biomes){const group=new T.Group();scene.add(group);for(let i=0;i<24;i++){const a=i*2.4,r=100+Math.sqrt(i)*62,x=Math.cos(biomes.indexOf(b)*Math.PI/3)*r+Math.cos(a)*18,z=Math.sin(biomes.indexOf(b)*Math.PI/3)*r+Math.sin(a)*18;
 if(b.id==='desert'){const cactus=new T.Mesh(new T.CylinderGeometry(.18,.23,1.4,6),new T.MeshStandardMaterial({color:'#7c8c5b'}));cactus.position.set(x,terrainHeight(x,z)+.7,z);group.add(cactus)}
 if(b.id==='ice'||b.id==='tundra'){const rock=new T.Mesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:b.id==='ice'?'#b9d9df':'#989f92',roughness:.6}));rock.position.set(x,terrainHeight(x,z)+.4,z);rock.scale.set(2,.8,1.2);group.add(rock)}}}
 const npc=person(1);npc.root.position.set(9,terrainHeight(9,14),14);scene.add(npc.root);const tag=label('Milena · exploradora');tag.name='explorer-nameplate';tag.position.set(9,2.8,14);scene.add(tag);
 const structure=(x:number,z:number,roof:boolean)=>{const g=new T.Group();g.position.set(x,terrainHeight(x,z),z);scene.add(g);const m=new T.MeshStandardMaterial({color:roof?'#74664d':'#9b9d89'});for(const a of[-1,1])for(const b of[-1,1]){const p=new T.Mesh(new T.CylinderGeometry(.3,.4,4,8),m);p.position.set(a*3,2,b*3);g.add(p)}if(roof){const top=new T.Mesh(new T.BoxGeometry(8,.25,8),new T.MeshStandardMaterial({color:'#4e6855'}));top.position.y=4.2;g.add(top)}return g};
 for(const c of camps.filter(c=>c.id!=='base'))structure(c.x,c.z,true);
 const obstacles:Obstacle[]=[];
 const ruin=landmarks.find(p=>p.id==='ruin')!;structure(ruin.x,ruin.z,false);const door=new T.Mesh(new T.BoxGeometry(3,3,.4),new T.MeshStandardMaterial({color:'#727b6e'}));door.position.set(ruin.x,terrainHeight(ruin.x,ruin.z)+1.5,ruin.z-2);scene.add(door);const doorObstacle:Obstacle={x:ruin.x,z:ruin.z-2,width:3.2,depth:.5};obstacles.push(doorObstacle);
 for(const side of[-1,1]){const wall=new T.Mesh(new T.BoxGeometry(.4,3,10),new T.MeshStandardMaterial({color:'#8c9583'}));wall.position.set(ruin.x+side*2,terrainHeight(ruin.x,ruin.z)+1.5,ruin.z-4);scene.add(wall);obstacles.push({x:ruin.x+side*2,z:ruin.z-4,width:.4,depth:10})}
 const backWall=new T.Mesh(new T.BoxGeometry(4.4,3,.4),new T.MeshStandardMaterial({color:'#8c9583'}));backWall.position.set(ruin.x,terrainHeight(ruin.x,ruin.z)+1.5,ruin.z-9);scene.add(backWall);obstacles.push({x:ruin.x,z:ruin.z-9,width:4.4,depth:.4});
 const relic=new T.Mesh(new T.OctahedronGeometry(.3),new T.MeshStandardMaterial({color:'#b7aa6c'}));relic.position.set(ruin.x,terrainHeight(ruin.x,ruin.z)+.65,ruin.z-7);scene.add(relic);
 const final=landmarks.find(p=>p.id==='final')!,tower=new T.Mesh(new T.CylinderGeometry(1.4,2.5,14,12),new T.MeshStandardMaterial({color:'#d2d5c1'}));tower.position.set(final.x,terrainHeight(final.x,final.z)+7,final.z);scene.add(tower);
 const userCamp=new T.Group();scene.add(userCamp);const tent=new T.Mesh(new T.ConeGeometry(2,2.5,4),new T.MeshStandardMaterial({color:'#bc9a61'}));tent.position.y=1.25;userCamp.add(tent);const campFlame=new T.Mesh(new T.ConeGeometry(.4,.9,7),new T.MeshStandardMaterial({color:'#edc66d',emissive:'#e69739',emissiveIntensity:1}));campFlame.position.set(3,.6,0);userCamp.add(campFlame);for(let i=0;i<3;i++){const log=new T.Mesh(new T.CylinderGeometry(.12,.12,1.2,6),new T.MeshStandardMaterial({color:'#6c503b'}));log.rotation.z=Math.PI/2;log.rotation.y=i*1.1;log.position.set(3,.12,0);userCamp.add(log)}
 const fireLight=new T.PointLight('#ffc57d',15,15);fireLight.position.set(3,1,0);userCamp.add(fireLight);
 const torch=new T.Group();actor.sockets.rightHand.add(torch);torch.position.set(0,0,.08);const shaft=new T.Mesh(new T.CylinderGeometry(.04,.05,.6,6),new T.MeshStandardMaterial({color:'#92714d'}));shaft.position.y=.3;torch.add(shaft);const flame=new T.Mesh(new T.ConeGeometry(.09,.25,6),new T.MeshStandardMaterial({color:'#e9c76a',emissive:'#e9a34d',emissiveIntensity:1}));flame.position.y=.72;torch.add(flame);const torchLight=new T.PointLight('#ffd391',5,20);torchLight.position.y=.7;torch.add(torchLight);
const bow=new T.Group();actor.sockets.rightHand.add(bow);const arc=new T.Mesh(new T.TorusGeometry(.4,.025,6,20,Math.PI),new T.MeshStandardMaterial({color:'#98734d'}));bow.add(arc);const string=new T.Mesh(new T.CylinderGeometry(.008,.008,.8,4),new T.MeshStandardMaterial({color:'#ddd1a2'}));string.rotation.z=Math.PI/2;bow.add(string);bow.position.z=.2;bow.rotation.z=Math.PI/2;
 const rainGeo=new T.BufferGeometry(),rainPos=new Float32Array(200*3);rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));const rain=new T.Points(rainGeo,new T.PointsMaterial({color:'#d7e3df',size:.12,transparent:true,opacity:.7}));scene.add(rain);
 const handWorldQ=new T.Quaternion(),actorWorldQ=new T.Quaternion();
 return {animals,obstacles,
 update(s:Expedition,dt:number,p:{x:number;z:number;running:boolean;sneaking:boolean;swimming:boolean;tree:boolean;light?:boolean},query:(x:number,z:number)=>Obstacle[]){
  const movedAnimals=new Set<string>();
  const move=(a:Animal,x:number,z:number,speed:number,seconds:number)=>{const dx=x-a.x,dz=z-a.z,len=Math.hypot(dx,dz);if(len<.2)return;const n=stepPosition({x:a.x,y:a.z},dx/len,dz/len,seconds,speed,query(a.x,a.z),BOUNDARY);if(Math.hypot(n.x-a.x,n.y-a.z)>.0001)movedAnimals.add(a.id);a.heading=Math.atan2(n.x-a.x,n.y-a.z);a.x=n.x;a.z=n.y};
  if(!s.dead)stepFauna(animals,s,dt,p,move);
  animals.forEach((a,i)=>{const m=models[i];if(s.ledger['animal:'+a.id]?.remaining===0&&Date.now()<s.ledger['animal:'+a.id].readyAt)a.mode='dead';m.root.visible=a.mode!=='dead'&&Math.hypot(a.x-p.x,a.z-p.z)<100;m.root.position.set(a.x,terrainHeight(a.x,a.z),a.z);m.root.rotation.y=a.heading;if(cubs[i]&&a.cub){cubs[i]!.root.visible=m.root.visible;cubs[i]!.root.position.set(a.cub.x,terrainHeight(a.cub.x,a.cub.z),a.cub.z)}m.parts.forEach((leg,j)=>{if(a.species.shape==='snake')leg.position.x=Math.sin(s.time*3+j*.8)*.18;else leg.rotation.x=movedAnimals.has(a.id)?Math.sin(s.time*(a.mode==='pursue'?11:3)+j*Math.PI)*.15:0})});
  for(const {n,root}of resourceModels)root.visible=Math.hypot(n.x-p.x,n.z-p.z)<100&&available(s,n)>0;
  door.visible=!s.progress.puzzle;doorObstacle.disabled=!!s.progress.puzzle;relic.visible=!s.progress.artifact;userCamp.visible=!!s.camp;tent.visible=!!s.camp?.built;if(s.camp){userCamp.position.set(s.camp.x,terrainHeight(s.camp.x,s.camp.z),s.camp.z);fireLight.visible=s.camp.fireUntil>s.time;campFlame.visible=fireLight.visible;campFlame.scale.y=1+Math.sin(s.time*8)*.1}
  torch.quaternion.copy(actor.sockets.rightHand.getWorldQuaternion(handWorldQ).invert()).multiply(actor.root.getWorldQuaternion(actorWorldQ));
  torch.visible=s.torchLit;bow.visible=s.activity?.kind==='hunt';
  const climate=worldClimate(s.time,p.x,p.z);(rain.material as T.PointsMaterial).color.set(climate.biome.id==='desert'?'#c4ad7b':climate.temp<0?'#edf4ef':'#b7d7dd');rain.visible=climate.storm||climate.weather==='Chuva tropical';rain.position.set(p.x,terrainHeight(p.x,p.z),p.z);for(let i=0;i<200;i++){rainPos[i*3]=Math.sin(i*23.4)*22;rainPos[i*3+1]=((i*.13-s.time*(climate.biome.id==='ice'?1:6))%15+15)%15;rainPos[i*3+2]=Math.cos(i*51.8)*22}rainGeo.attributes.position.needsUpdate=true;
 },
 nearest(x:number,z:number){return animals.filter(a=>a.mode!=='dead').reduce<Animal|undefined>((a,b)=>!a||Math.hypot(b.x-x,b.z-z)<Math.hypot(a.x-x,a.z-z)?b:a,undefined)}
 };
}
