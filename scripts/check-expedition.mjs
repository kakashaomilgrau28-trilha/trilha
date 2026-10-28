import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
// Resolve Vite's existing compiler dependency, including strict pnpm layouts.
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({stdin:{contents:"export * from './src/lobby/exploration';export * from './src/lobby/caverns';export * from './src/lobby/motion';export * from './src/lobby/coveredCamera';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
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
 assert.equal(e.caveRoofAt(state.x,state.z)?.id,cave.id,'interior remains below the intact hillside');
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

assert.equal(e.coverAt(0,30,[]),'abrigo','walkable camp shelter activates the indoor camera');
assert.equal(e.coverAt(0,8,[]),'','open camp restores isometric view');
assert.equal(e.coverAt(2,2,[{x:2,z:3,width:.6,depth:.6,canopy:3}]),'copa','canopy brings camera below leaves');
for(const c of e.caves)assert.equal(e.coverAt(c.x,c.z-20,[]),'caverna');
const wall=e.obstacleIndex([{x:0,z:2,width:6,depth:.5}]);
const boom=e.cameraBoom(0,0,0,3.5,wall);
assert.ok(boom<1.6&&boom>.3,'camera retracts before a wall');
assert.equal(e.cameraBoom(0,0,Math.PI/2,3.5,wall),3.5,'clear direction preserves camera distance');
// Every route belongs to the camp network: junctions are exact shared vertices.
const reached=new Set(['0,38']);let previous=-1;
while(previous!==reached.size){previous=reached.size;for(const t of e.trails)if(t.points.some(p=>reached.has(p.join(','))))for(const p of t.points)reached.add(p.join(','));}
for(const t of e.trails)assert.ok(t.points.every(p=>reached.has(p.join(','))),t.name+' connects to camp');
for(const p of e.destinations)assert.ok(e.trailDistance(p.x,p.z)<1.5,p.name+' lies on the trail network');
console.log('PASS: complete connected trail network, landmark access, shelter/cave/canopy camera detection, clear boom and wall collision');

let lastHorizontal=Infinity,lastFov=0;
for(let i=0;i<=100;i++){const f=e.coveredFraming(i/100,30,3.5);assert.ok(f.horizontal<=lastHorizontal&&f.fov>=lastFov,'continuous camera dolly and lens');lastHorizontal=f.horizontal;lastFov=f.fov;}
assert.ok(Math.abs(e.coveredFraming(1,30,3.5).fov-65)<1e-8,'close lens reaches its intended field');
console.log('PASS: continuous matched framing from distant isometric view to the close lens');

assert.equal(e.coverAt(0,0,[{x:0,z:6,width:.6,depth:.6,canopy:3}],0),'copa','foreground canopy approaches camera before hiding the player');
