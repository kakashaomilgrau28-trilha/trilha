import * as T from 'three';
import {person,disposeScene} from '../world/character';
import {stepPosition,type Obstacle} from '../world/physics';
type Actor=ReturnType<typeof person>;
type Frame={time:number;dt:number;x:number;y:number;z:number;heading:number;speed:number;distance:number;mounted:boolean;light:boolean;observing:boolean;action:number;playing:boolean;goal?:{x:number;z:number};height:(x:number,z:number)=>number;obstacles:(x:number,z:number)=>Obstacle[]};
export function createEquipment(actor:Actor,scene:T.Scene,id:string){
 const root=new T.Group(),extra:T.Object3D[]=[],mats=new Map<string,T.MeshStandardMaterial>();
 const mat=(c:string)=>{let m=mats.get(c);if(!m){m=new T.MeshStandardMaterial({color:c,roughness:.7});mats.set(c,m)}return m};
 const mesh=(g:T.BufferGeometry,c:string,parent:T.Object3D=root)=>{const m=new T.Mesh(g,mat(c));m.castShadow=m.receiveShadow=true;parent.add(m);return m};
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,c:string,parent:T.Object3D=root)=>{const m=mesh(new T.BoxGeometry(w,h,d),c,parent);m.position.set(x,y,z);return m};
 const ball=(r:number,x:number,y:number,z:number,c:string,parent:T.Object3D=root)=>{const m=mesh(new T.SphereGeometry(r,12,8),c,parent);m.position.set(x,y,z);return m};
 const cylinder=(r:number,h:number,x:number,y:number,z:number,c:string,parent:T.Object3D=root)=>{const m=mesh(new T.CylinderGeometry(r,r,h,12),c,parent);m.position.set(x,y,z);return m};
 const rod=(a:T.Vector3,b:T.Vector3,r:number,c:string,parent:T.Object3D=root)=>{const m=cylinder(r,a.distanceTo(b),0,0,0,c,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return m};
 const wheels:T.Group[]=[],crank=new T.Group(),legs:T.Group[]=[],tail=new T.Group(),head=new T.Group(),needle=new T.Group();
 needle.name='compass-needle';crank.name='bicycle-crank';
 let beam:T.SpotLight|undefined,fill:T.PointLight|undefined;
 const handItems=['lanterna','cantil','corda','bussola'];
 if(id==='mapa'){
  actor.sockets.chest.add(root);root.position.z=.38;
  box(.66,.025,.42,0,0,0,'#e4d7b2');
  for(let i=0;i<4;i++)box(.56,.003,.018,0,.015,-.14+i*.09,'#879d74');
  rod(new T.Vector3(-.2,.018,.16),new T.Vector3(.22,.018,-.13),.014,'#a77e4e');
 }else if(id==='bicicleta'){
  scene.add(root);
  for(const z of [-.85,.85]){const wheel=new T.Group();wheel.position.set(0,.5,z);root.add(wheel);wheels.push(wheel);
   const tire=mesh(new T.TorusGeometry(.48,.055,8,32),'#28312d',wheel);tire.rotation.y=Math.PI/2;
   for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(new T.Vector3(),new T.Vector3(0,Math.cos(a)*.44,Math.sin(a)*.44),.009,'#b9c4bc',wheel)}
  }
  const p=[new T.Vector3(0,.55,0),new T.Vector3(0,.5,-.85),new T.Vector3(0,.5,.85),new T.Vector3(0,1.1,-.2),new T.Vector3(0,1.2,.58)];
  for(const [a,b]of[[0,1],[0,2],[0,3],[1,3],[2,4],[3,4]])rod(p[a],p[b],.035,'#c58c47');
  rod(p[4],new T.Vector3(0,1.4,.58),.04,'#aebdb2');box(.65,.045,.07,0,1.4,.58,'#26392d');box(.34,.08,.3,0,1.15,-.2,'#29362d');
  crank.position.set(0,.55,0);root.add(crank);
  for(const side of[-1,1]){rod(new T.Vector3(),new T.Vector3(side*.22,0,side*.17),.025,'#c0c8bc',crank);box(.18,.045,.13,side*.26,0,side*.17,'#374335',crank)}
 }else if(id==='pet'){
  scene.add(root);
  const body=ball(.27,0,.44,0,'#b78a57');body.scale.set(.8,1,1.5);
  root.add(head);head.position.set(0,.68,.32);ball(.21,0,0,0,'#b78a57',head);ball(.12,0,-.06,.17,'#d8b887',head);ball(.045,0,-.03,.26,'#2c322b',head);
  for(const side of[-1,1]){const ear=ball(.11,side*.16,.02,-.04,'#684931',head);ear.scale.y=1.5;ball(.023,side*.095,.045,.17,'#1d3028',head);}
  for(const x of[-.15,.15])for(const z of[-.24,.22]){const leg=new T.Group();leg.position.set(x,.38,z);root.add(leg);box(.09,.3,.11,0,-.15,0,'#a47a48',leg);legs.push(leg)}
  tail.position.set(0,.49,-.37);root.add(tail);const tip=ball(.07,0,.12,-.12,'#684931',tail);tip.scale.set(1,2,1);box(.35,.035,.035,0,.61,.15,'#d1bc6b');
 }else if(id==='botas'){
  for(const socket of[actor.sockets.leftFoot,actor.sockets.rightFoot]){const boot=new T.Group();socket.add(boot);extra.push(boot);box(.26,.21,.36,0,.04,0,'#946c43',boot);box(.27,.045,.38,0,-.065,.015,'#252d25',boot);for(let i=0;i<3;i++)box(.18,.015,.018,0,.15,-.07+i*.06,'#d2b982',boot)}
 }else if(id==='capacete'){
  actor.sockets.head.add(root);const shell=mesh(new T.SphereGeometry(.275,16,10,0,Math.PI*2,0,Math.PI/2),'#d5b15b');shell.position.y=.12;box(.59,.04,.5,0,.12,0,'#bd9446');box(.17,.12,.13,0,.22,.25,'#e5dfb6');
 }else if(id==='binoculos'){
  actor.sockets.chest.add(root);root.position.set(0,.02,.38);
  for(const x of[-.13,.13]){const barrel=cylinder(.105,.32,x,0,.05,'#3b4e3c');barrel.rotation.x=Math.PI/2;const glass=cylinder(.087,.02,x,0,.22,'#739a99');glass.rotation.x=Math.PI/2;}box(.24,.06,.08,0,0,0,'#536349');
 }else if(handItems.includes(id)){
  actor.sockets.rightHand.add(root);
  if(id==='lanterna'){const handle=cylinder(.065,.24,0,0,.06,'#bca15d');handle.rotation.x=Math.PI/2;const lens=cylinder(.1,.09,0,0,.22,'#dce4cf');lens.rotation.x=Math.PI/2;box(.04,.025,.05,0,.07,.08,'#304838')}
  if(id==='cantil'){const bottle=cylinder(.115,.28,0,.11,0,'#668b78');bottle.scale.z=.65;cylinder(.043,.07,0,.285,0,'#d4c697');box(.03,.12,.025,.135,.1,0,'#bc9d6d')}
  if(id==='corda'){for(let i=0;i<4;i++){const loop=mesh(new T.TorusGeometry(.18+i*.015,.024,6,24),'#c2a36c');loop.position.z=i*.035;loop.rotation.y=.2;}box(.08,.11,.1,0,0,.1,'#796743')}
  if(id==='bussola'){cylinder(.145,.05,0,.02,0,'#d8b969');cylinder(.115,.055,0,.025,0,'#e2e7cf');root.add(needle);needle.position.y=.06;const arrow=mesh(new T.ConeGeometry(.035,.18,3),'#b45740',needle);arrow.rotation.x=-Math.PI/2;arrow.position.z=-.045;box(.02,.015,.12,0,0,.06,'#506750',needle)}
 }
 if(id==='lanterna'||id==='capacete'){
  beam=new T.SpotLight('#fff0c8',id==='capacete'?110:85,40,.52,.6,1.2);beam.position.set(0,id==='capacete'?.22:0,id==='capacete'?.3:.25);beam.target.position.set(0,id==='capacete'?-.5:-.3,15);root.add(beam,beam.target);
  fill=new T.PointLight('#e9ddbb',.65,4,2);fill.position.y=.3;root.add(fill);
 }
 let initialized=false,previousMounted=true,parked=new T.Vector3(),parkHeading=0,petPhase=0;
 const worldQ=new T.Quaternion(),parentQ=new T.Quaternion(),offsetQ=new T.Quaternion(),axisX=new T.Vector3(1,0,0),north=new T.Vector3(),goal=new T.Vector3();
 const initialize=(f:Frame)=>{if(initialized)return;root.position.set(f.x,f.y,f.z);root.rotation.y=f.heading;initialized=true;parked.set(f.x+.8,f.y,f.z);parkHeading=f.heading};
 return {root,id,get phase(){return crank.rotation.x},get parkedDistance(){return (x:number,z:number)=>Math.hypot(parked.x-x,parked.z-z)},
  update(f:Frame){
   if(handItems.includes(id)){
    actor.root.getWorldQuaternion(worldQ);root.parent!.getWorldQuaternion(parentQ);offsetQ.setFromAxisAngle(axisX,id==='cantil'?-f.action*.9:0);root.quaternion.copy(parentQ.invert()).multiply(worldQ).multiply(offsetQ);
    if(id==='bussola'){root.getWorldQuaternion(parentQ);north.set(0,0,-1).applyQuaternion(parentQ.invert());needle.rotation.y=Math.atan2(-north.x,-north.z)}
   }
   if(id==='binoculos'){root.position.y=f.observing?.52:.02;root.position.z=f.observing?.2:.38;}
   if(beam){beam.visible=f.light;fill!.visible=f.light;}
   if(id==='bicicleta'){
    initialize(f);
    if(!f.mounted&&previousMounted){parked.set(f.x+.85*Math.cos(f.heading),f.height(f.x+.85*Math.cos(f.heading),f.z-.85*Math.sin(f.heading)),f.z-.85*Math.sin(f.heading));parkHeading=f.heading;}
    if(f.mounted){root.position.set(f.x,f.y,f.z);root.rotation.set(0,f.heading,0);for(const w of wheels)w.rotation.x+=f.distance/.48;crank.rotation.x+=f.distance/.48*.45;}
    else{root.position.copy(parked);root.rotation.set(0,parkHeading,-.12)}
    previousMounted=f.mounted;
   }
   if(id==='pet'){
    initialize(f);
    const forwardX=Math.sin(f.heading),forwardZ=Math.cos(f.heading);
    if(f.playing&&f.goal)goal.set(f.goal.x,f.height(f.goal.x,f.goal.z),f.goal.z);
    else if(f.playing)goal.set(f.x+Math.cos(f.time*2)*1.5,f.y,f.z+Math.sin(f.time*2)*1.5);
    else goal.set(f.x-forwardX*1.3+forwardZ*.8,f.y,f.z-forwardZ*1.3-forwardX*.8);
    const dx=goal.x-root.position.x,dz=goal.z-root.position.z,len=Math.hypot(dx,dz),step=len>.25?Math.min(6,len*3):0;
    const p=stepPosition({x:root.position.x,y:root.position.z},dx/(len||1),dz/(len||1),f.dt,step,f.obstacles(root.position.x,root.position.z));
    const moved=Math.hypot(p.x-root.position.x,p.y-root.position.z);root.position.set(p.x,f.height(p.x,p.y),p.y);if(moved>.001)root.rotation.y=Math.atan2(dx,dz);
    petPhase+=moved*11;legs.forEach((leg,i)=>leg.rotation.x=Math.sin(petPhase+(i===0||i===3?0:Math.PI))*(moved>.001?.55:0));tail.rotation.z=Math.sin(f.time*12)*(f.playing?.65:.3);head.rotation.x=f.playing&&len<1?.3:0;
   }
  },
  dispose(){root.removeFromParent();disposeScene(root);for(const part of extra){part.removeFromParent();disposeScene(part)}for(const m of mats.values())m.dispose();}
 };
}
export type Equipment=ReturnType<typeof createEquipment>;

