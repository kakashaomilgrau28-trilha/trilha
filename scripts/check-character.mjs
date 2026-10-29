import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const b=await build({stdin:{contents:"export * from './src/world/character';export * from './src/world/ropePose';export * from './src/lobby/ropeRig';export * from './src/lobby/traversal';import * as T from 'three';export {T};",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const e=await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString('base64')}`),T=e.T;
globalThis.document={createElement:()=>({width:64,height:64,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
for(let avatar=0;avatar<6;avatar++){
 const actor=e.person(avatar),rig=e.createRopeRig();actor.root.add(rig.root);
 for(const fps of [30,60,144])for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  actor.resetAnimation();actor.root.position.set(130,7,-175);actor.root.rotation.y=heading;
  for(let i=0;i<6;i++)actor.animate(i/fps,true,'Celebrar',false,{speed:1.6,air:4,landing:0,item:'corda',crossing:true});
  actor.root.updateMatrixWorld(true);
  const hands=[actor.sockets.leftHand,actor.sockets.rightHand];
  hands.forEach((hand,i)=>assert.ok(hand.getWorldPosition(new T.Vector3()).distanceTo(rig.grips[i].getWorldPosition(new T.Vector3()))<1e-6,'both real wrist sockets touch the handle at every heading/fps'));
  const head=actor.sockets.head.getWorldPosition(new T.Vector3()),cableY=actor.root.position.y+e.ROPE_CABLE_HEIGHT;
  assert.ok(cableY-head.y-.3>.3,'overhead cable clears head/hair by over 30 cm');
 }
 actor.resetAnimation();for(let i=0;i<120;i++)actor.animate(i/60,false,'',false,{speed:0,air:0,landing:0});
 for(const foot of [actor.sockets.leftFoot,actor.sockets.rightFoot])assert.ok(Math.abs(foot.parent.rotation.x)<1e-10,'stationary character does not cycle legs');
 e.disposeScene(actor.root);
}
for(const start of [121,149]){const trip=e.createRopeTrip(start,-175);trip.elapsed=trip.duration/2;const p=e.ropeFrame(trip),c=e.ropePoint(trip.a,trip.b,p.progress);assert.equal(p.attached,true);assert.ok(Math.abs(p.y+e.ROPE_CABLE_HEIGHT-c.y)<1e-8);}
const approach=e.createRopeTrip(119,-175);approach.elapsed=approach.approach/2;assert.equal(e.ropeFrame(approach).attached,false,'approach is walking, not dangling from an unconnected handle');
console.log('PASS: six avatars; wrist-to-grip contact, head clearance and idle legs at 30/60/144 Hz; forward/reverse traversal and unhooked approach');
