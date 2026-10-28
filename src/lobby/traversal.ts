import {terrainHeight,ropeCrossing} from './exploration';
export const ROPE_SPEED=1.6;
type Point={x:number;z:number;y:number};
export type RopeTrip={from:{x:number;z:number};a:Point;b:Point;elapsed:number;approach:number;duration:number};
export function ropeAnchors(){return [ropeCrossing.from,ropeCrossing.to].map(p=>({...p,y:terrainHeight(p.x,p.z)})) as [Point,Point]}
/** The rendered cable and traversing hands use exactly this sagging span. */
export function ropePoint(a:Point,b:Point,t:number){return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t+1.9-Math.sin(t*Math.PI)*.4}}
export function createRopeTrip(x:number,z:number){const [left,right]=ropeAnchors(),a=Math.hypot(x-left.x,z-left.z)<Math.hypot(x-right.x,z-right.z)?left:right,b=a===left?right:left,approach=Math.hypot(x-a.x,z-a.z)/3.6;return {from:{x,z},a,b,elapsed:0,approach,duration:approach+Math.hypot(b.x-a.x,b.z-a.z)/ROPE_SPEED}}
export function ropeFrame(trip:RopeTrip){
 if(trip.approach>0&&trip.elapsed<trip.approach){const t=trip.elapsed/trip.approach,x=trip.from.x+(trip.a.x-trip.from.x)*t,z=trip.from.z+(trip.a.z-trip.from.z)*t;return {x,z,y:terrainHeight(x,z),progress:0,done:false}}
 const t=Math.min(1,Math.max(0,(trip.elapsed-trip.approach)/(trip.duration-trip.approach))),p=ropePoint(trip.a,trip.b,t);return {...p,y:p.y-1.9,progress:t,done:t>=1};
}
export const ropeStaminaNeeded=(trip:RopeTrip,weight:number,cold:boolean)=>Math.ceil(trip.duration*(3+Math.max(0,weight-8)*.18+(cold?.6:0))+10);
