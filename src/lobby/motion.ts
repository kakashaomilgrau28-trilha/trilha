import {stepPosition,type Obstacle} from '../world/physics';

export function dampAngle(current:number,target:number,rate:number,dt:number){
 const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+difference*(1-Math.exp(-rate*dt));
}

/** A spatial hash keeps collision queries local, even with thousands of trunks. */
export function obstacleIndex(obstacles:Obstacle[],cell=12){
 const buckets=new Map<string,Obstacle[]>();
 for(const o of obstacles)for(let x=Math.floor((o.x-o.width/2-1)/cell);x<=Math.floor((o.x+o.width/2+1)/cell);x++)
  for(let z=Math.floor((o.z-o.depth/2-1)/cell);z<=Math.floor((o.z+o.depth/2+1)/cell);z++){
   const key=`${x}:${z}`,bucket=buckets.get(key)??[];bucket.push(o);buckets.set(key,bucket);
  }
 const buffer:Obstacle[]=[],seen=new Set<Obstacle>();
 return (x:number,z:number,radius=2)=>{
  buffer.length=0;seen.clear();
  for(let a=Math.floor((x-radius)/cell);a<=Math.floor((x+radius)/cell);a++)for(let b=Math.floor((z-radius)/cell);b<=Math.floor((z+radius)/cell);b++)
   for(const o of buckets.get(`${a}:${b}`)??[])if(!seen.has(o)){seen.add(o);buffer.push(o)}
  return buffer;
 };
}

export function createMotion(x:number,z:number,height:(x:number,z:number)=>number){
 return {x,z,y:height(x,z),vx:0,vz:0,vy:0,grounded:true,landing:0,collision:0,accumulator:0,jumpBuffer:0};
}
export type MotionState=ReturnType<typeof createMotion>;
type MotionInput={x:number;z:number;speed:number;jump:boolean;enabled:boolean;bike:boolean};
export function advanceMotion(state:MotionState,input:MotionInput,seconds:number,height:(x:number,z:number)=>number,query:ReturnType<typeof obstacleIndex>,boundary:number){
 if(!input.enabled){state.vx=state.vz=0;state.accumulator=0;state.jumpBuffer=0;return}
 if(input.jump)state.jumpBuffer=.14;
 state.accumulator+=Math.max(0,Math.min(seconds,.1));
 const dt=1/120;
 while(state.accumulator>=dt){
  state.accumulator-=dt;state.jumpBuffer=Math.max(0,state.jumpBuffer-dt);
  const length=Math.max(1,Math.hypot(input.x,input.z)),tx=input.x/length*input.speed,tz=input.z/length*input.speed;
  const accelerating=!!(input.x||input.z),rate=input.bike?(accelerating?7:10):(accelerating?20:28),blend=1-Math.exp(-rate*dt);
  state.vx+=(tx-state.vx)*blend;state.vz+=(tz-state.vz)*blend;
  const next=stepPosition({x:state.x,y:state.z},state.vx/(Math.hypot(state.vx,state.vz)||1),state.vz/(Math.hypot(state.vx,state.vz)||1),dt,Math.hypot(state.vx,state.vz),query(state.x,state.z),boundary);
  const blockedX=Math.abs(next.x-state.x)<1e-7&&Math.abs(state.vx)>.3,blockedZ=Math.abs(next.y-state.z)<1e-7&&Math.abs(state.vz)>.3;
  state.collision=Math.max(blockedX||blockedZ?.2:0,state.collision-dt);
  if(blockedX)state.vx=0;if(blockedZ)state.vz=0;
  state.x=next.x;state.z=next.y;
  const floor=height(state.x,state.z);
  if(state.grounded&&state.jumpBuffer>0&&!input.bike){state.vy=5.3;state.grounded=false;state.jumpBuffer=0}
  if(state.grounded&&state.y-floor>.28){state.grounded=false;state.vy=0}
  if(!state.grounded){state.vy-=16*dt;state.y+=state.vy*dt;if(state.y<=floor){state.landing=Math.min(1,Math.abs(state.vy)/8);state.y=floor;state.vy=0;state.grounded=true}}
  else state.y=floor;
  state.landing=Math.max(0,state.landing-dt*4);
 }
}
