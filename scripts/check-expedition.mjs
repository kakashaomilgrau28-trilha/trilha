import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
// Resolve Vite's existing compiler dependency, including strict pnpm layouts.
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({stdin:{contents:"export * from './src/lobby/exploration';export * from './src/lobby/caverns';export * from './src/lobby/motion';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const e=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const obstacles=[];
e.buildCaverns({add(){}},obstacles);
assert.equal(new Set(e.discoveries.map(r=>r.id)).size,16,'retain all 16 discovery IDs');
const query=e.obstacleIndex(obstacles);
for(const cave of e.caves){
 const route=e.caveRoute(cave),state=e.createMotion(cave.x,cave.z+10,e.terrainHeight);
 for(const [x,z]of route){
  let frames=0;
  while(Math.hypot(x-state.x,z-state.z)>.4&&frames++<2400){const dx=x-state.x,dz=z-state.z,len=Math.hypot(dx,dz);e.advanceMotion(state,{x:dx/len,z:dz/len,speed:3.6,jump:false,enabled:true,bike:false},1/60,e.terrainHeight,query,e.BOUNDARY)}
  assert.ok(Math.hypot(x-state.x,z-state.z)<.6,`${cave.id}: approach, portal and gallery remain traversable (${x},${z})`);
 }
 assert.equal(e.caveAt(state.x,state.z)?.id,cave.id,'chamber detected from shared geometry');
 assert.ok(e.surfaceHeight(state.x,state.z)>e.terrainHeight(state.x,state.z)+5,`${cave.id}: gallery under hill, surface ${e.surfaceHeight(state.x,state.z)}, floor ${e.terrainHeight(state.x,state.z)}`);
 assert.equal(e.caveRoofAt(state.x,state.z)?.id,cave.id,'interior roof participates in cutaway');
 for(const [x,z]of route.slice().reverse()){
  let frames=0;while(Math.hypot(x-state.x,z-state.z)>.4&&frames++<2400){const dx=x-state.x,dz=z-state.z,len=Math.hypot(dx,dz);e.advanceMotion(state,{x:dx/len,z:dz/len,speed:3.6,jump:false,enabled:true,bike:false},1/60,e.terrainHeight,query,e.BOUNDARY)}
  assert.ok(Math.hypot(x-state.x,z-state.z)<.6,`${cave.id}: gallery exit remains traversable`);
 }
 const approach=e.trails.filter(t=>Math.hypot(t.points.at(-1)[0]-cave.x,t.points.at(-1)[1]-cave.z)<1);
 assert.ok(approach.length,'each portal is connected to a real trail');
 assert.ok(approach.every(t=>t.points.at(-2)[1]>cave.z),'trails approach the open face of each cave');
}
for(const p of [...e.discoveries,...e.destinations])assert.ok(Math.abs(p.x)<e.BOUNDARY&&Math.abs(p.z)<e.BOUNDARY,'all destinations and rewards within world bounds');
assert.ok(Math.hypot(e.riverPoints[0][0]-e.destinations.find(p=>p.id==='cachoeira').x,e.riverPoints[0][1]-e.destinations.find(p=>p.id==='cachoeira').z)<2,'watercourse begins at the cascade');
console.log('PASS: 16 unique discoveries, bounds, both cave entry/gallery/chamber/exit collision simulations, roof integration, trail approaches and connected watercourse');
