import * as T from 'three';
import {ROPE_CABLE_HEIGHT,ROPE_GRIP} from '../world/ropePose';
import {ropeAnchors,ropePoint} from './traversal';
export function createRopeSpan(){
 const root=new T.Group(),[a,b]=ropeAnchors(),material=new T.MeshStandardMaterial({color:'#d4b77d',roughness:1});
 const curve=new(class extends T.Curve<T.Vector3>{constructor(){super()}getPoint(t:number,v=new T.Vector3()){const p=ropePoint(a,b,t);return v.set(p.x,p.y,p.z)}})();
 root.add(new T.Mesh(new T.TubeGeometry(curve,64,.045,6,false),material));
 for(const p of [a,b]){const hanger=new T.Mesh(new T.CylinderGeometry(.035,.035,.3,8),material);hanger.position.set(p.x,p.y+ROPE_CABLE_HEIGHT+.15,p.z);root.add(hanger)}
 return root;
}
/** Trolley, hand grip and harness sit outside the character's head and torso. */
export function createRopeRig(){
 const root=new T.Group();root.name='rope-trolley';root.visible=false;
 const metal=new T.MeshStandardMaterial({color:'#858b7e',metalness:.65,roughness:.4}),strap=new T.MeshStandardMaterial({color:'#b39252',roughness:.9});
 const rod=(a:T.Vector3,b:T.Vector3,r:number,material:T.Material)=>{const d=b.clone().sub(a),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),8),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;root.add(m);return m};
 const wheel=new T.Mesh(new T.TorusGeometry(.1,.035,8,16),metal);wheel.rotation.y=Math.PI/2;wheel.position.y=ROPE_CABLE_HEIGHT+.1;root.add(wheel);
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z),barY=ROPE_GRIP.height,barZ=ROPE_GRIP.forward;
 rod(v(-.41,barY,barZ),v(.41,barY,barZ),.035,metal);
 for(const side of [-1,1]){
  rod(v(0,ROPE_CABLE_HEIGHT+.05,0),v(side*.4,2.25,barZ),.025,metal);
  rod(v(side*.4,2.25,barZ),v(side*.4,barY,barZ),.025,metal);
  rod(v(side*.4,2.25,barZ),v(side*.22,.86,.24),.025,strap);
 }
 const grips=[-1,1].map(side=>{const p=new T.Object3D();p.name=side<0?'left-grip':'right-grip';p.position.set(side*ROPE_GRIP.halfWidth,barY,barZ);root.add(p);return p});
 return {root,grips,wheel};
}
