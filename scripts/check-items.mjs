import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const bundled=await build({stdin:{contents:"export * from './src/lobby/equipment';export * from './src/lobby/itemActions';export * from './src/lobby/gear';import * as T from 'three';export {T};",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const e=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`),T=e.T;
const scene=new T.Scene(),root=new T.Group();scene.add(root);
const sockets=Object.fromEntries(['leftHand','rightHand','head','chest','leftFoot','rightFoot'].map(k=>{const n=new T.Group();root.add(n);return [k,n]}));
const actor={root,sockets},frame={time:0,dt:1/60,x:0,y:0,z:0,heading:0,speed:0,distance:0,mounted:true,light:true,observing:false,action:0,playing:false,height:()=>0,obstacles:()=>[]};
for(const id of e.gearIds){
 const gear=e.createEquipment(actor,scene,id);gear.update(frame);let meshes=0,sprites=0;scene.traverse(n=>{if(n.isMesh)meshes++;if(n.isSprite)sprites++});assert.ok(meshes>0,`${id}: tangible 3D model`);assert.equal(sprites,0,`${id}: no billboard pretending to be equipment`);
 if(['lanterna','cantil','corda','bussola'].includes(id)){assert.equal(gear.root.parent,sockets.rightHand);const before=gear.root.getWorldPosition(new T.Vector3());sockets.rightHand.position.y+=.3;gear.update(frame);const after=gear.root.getWorldPosition(new T.Vector3());assert.ok(Math.abs(after.y-before.y-.3)<1e-6,'held item follows wrist movement');sockets.rightHand.position.y-=.3;}
 if(id==='botas'){assert.equal(sockets.leftFoot.children.length,1);assert.equal(sockets.rightFoot.children.length,1);}
 if(id==='capacete')assert.equal(gear.root.parent,sockets.head);
 if(id==='lanterna'||id==='capacete'){const lights=[];gear.root.traverse(n=>{if(n.isLight)lights.push(n)});gear.update({...frame,light:false});assert.ok(lights.every(l=>!l.visible),'light off really switches the physical lights off');gear.update({...frame,light:true});assert.ok(lights.every(l=>l.visible));}
 if(id==='bussola'){root.rotation.y=Math.PI*.73;gear.update({...frame,heading:root.rotation.y});const needle=gear.root.getObjectByName('compass-needle'),direction=new T.Vector3(0,0,-1).applyQuaternion(needle.getWorldQuaternion(new T.Quaternion()));assert.ok(direction.dot(new T.Vector3(0,0,-1))>.999,'needle remains pointed at world north');root.rotation.y=0;}
 if(id==='bicicleta'){gear.update({...frame,x:3,distance:3});assert.ok(gear.phase>0,'pedal crank responds to distance');gear.update({...frame,x:3,mounted:false});const park=gear.root.position.clone();gear.update({...frame,x:12,mounted:false});assert.ok(gear.root.position.distanceTo(park)<1e-8,'dismounted bicycle stays parked');assert.ok(gear.parkedDistance(12,0)>3,'mounting can validate proximity');}
 if(id==='pet'){assert.equal(gear.root.parent,scene);for(let i=0;i<60;i++)gear.update({...frame,time:i/60,x:4});assert.ok(gear.root.position.x>2,'companion follows independently');assert.ok(gear.root.position.z<-.7&&gear.root.position.distanceTo(new T.Vector3(4,0,0))>.7,'companion keeps an independent trailing position');}
 gear.dispose();assert.equal(scene.children.length,1,`${id}: world model removed`);assert.ok(Object.values(sockets).every(s=>!s.children.length),`${id}: sockets cleaned`);
}
let state={water:3,energy:20,action:null};
e.startWaterAction(state,false);e.startWaterAction(state,false);e.advanceWaterAction(state,.8,'cantil',true);assert.equal(state.water,3,'no instant charge or repeated click consumption');e.advanceWaterAction(state,1,'cantil',true);assert.equal(state.water,2);assert.equal(state.energy,65);e.advanceWaterAction(state,1,'cantil',true);assert.equal(state.water,2,'completion commits once');
e.startWaterAction(state,false);e.advanceWaterAction(state,2,'mapa',true);assert.equal(state.water,2,'switching item cancels without charge');
e.startWaterAction(state,true);e.advanceWaterAction(state,5,'cantil',false);assert.equal(state.water,2,'paused action does not finish');e.advanceWaterAction(state,2,'cantil',true);assert.equal(state.water,3,'refill completes only after elapsed active time');
console.log('PASS: ten real 3D equipment models, wrist/head/feet attachment, independent pet, parked bike/pedals, north-bearing compass, light toggles, disposal, and exactly-once/cancel/pause water actions');
