import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const compile=async path=>ts.transpileModule(await fs.readFile(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const url=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const physicsUrl=url(await compile('../src/world/physics.ts'));
const motionSource=(await compile('../src/lobby/motion.ts')).replace(/from ['"]\.\.\/world\/physics['"]/,`from '${physicsUrl}'`);
const {advanceMotion,createMotion,obstacleIndex,dampAngle}=await import(url(motionSource));
const flat=()=>0;
function simulate(hz,{seconds=2,obstacles=[],jump=false,bike=false}={}){
 const state=createMotion(0,0,flat),query=obstacleIndex(obstacles);
 let peak=0;
 for(let i=0;i<seconds*hz;i++){advanceMotion(state,{x:1,z:0,speed:6,jump:jump&&i===0,enabled:true,bike},1/hz,flat,query,465);peak=Math.max(peak,state.y)}
 return {state,peak};
}
const a=simulate(30),b=simulate(60),c=simulate(144);
assert.ok(Math.abs(a.state.x-b.state.x)<.06&&Math.abs(a.state.x-c.state.x)<.06,'movement consistent at 30, 60 and 144 Hz');
assert.ok(a.state.x>11&&a.state.x<12,'responsive acceleration keeps requested speed');
const jumping=[30,60,144].map(hz=>simulate(hz,{jump:true}));
assert.ok(jumping.every(r=>r.peak>.75&&r.peak<1&&r.state.grounded&&r.state.y===0),'bounded jump and reliable landing');
assert.ok(Math.max(...jumping.map(r=>r.peak))-Math.min(...jumping.map(r=>r.peak))<.04,'jump height independent of rendering frequency');
assert.equal(simulate(60,{jump:true,bike:true}).peak,0,'mounted cycling does not unexpectedly jump');
const wall={x:3,z:0,width:1,depth:12};
assert.ok(simulate(30,{obstacles:[wall]}).state.x<=2.01,'acceleration cannot tunnel through walls');
const moving=simulate(60).state,start=moving.x,query=obstacleIndex([]);
for(let i=0;i<60;i++)advanceMotion(moving,{x:0,z:0,speed:6,jump:false,enabled:true,bike:false},1/60,flat,query,465);
assert.ok(moving.x-start<.25&&Math.abs(moving.vx)<.001,'releasing controls stops promptly');
const paused=createMotion(0,0,flat);
advanceMotion(paused,{x:1,z:0,speed:14,jump:true,enabled:false,bike:false},1,flat,query,465);
assert.equal(paused.x,0);assert.equal(paused.y,0);
const edge=createMotion(464,0,flat);
for(let i=0;i<180;i++)advanceMotion(edge,{x:1,z:0,speed:14,jump:false,enabled:true,bike:true},1/60,flat,query,465);
assert.ok(edge.x<=465,'expanded boundary retained');
const obstacles=Array.from({length:1000},(_,i)=>({x:(i%40)*9-180,z:Math.floor(i/40)*11-130,width:1+i%7,depth:1+i%5}));
const lookup=obstacleIndex(obstacles);
for(let i=0;i<100;i++){const x=Math.sin(i*4.3)*180,z=Math.cos(i*3.2)*130,result=new Set(lookup(x,z));for(const o of obstacles)if(Math.abs(o.x-x)<o.width/2+1&&Math.abs(o.z-z)<o.depth/2+1)assert.ok(result.has(o),'spatial index cannot omit a possible collision')}
const angle=dampAngle(Math.PI-.01,-Math.PI+.01,12,1/60);
assert.ok(Math.abs(angle-(Math.PI-.01))<.01,'turning crosses the angle seam by the short path');
console.log('PASS: 30/60/144 Hz movement, jump/landing, braking, pause, walls, world boundary, spatial collision index and smooth turning');
