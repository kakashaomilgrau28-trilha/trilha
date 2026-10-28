import type {Obstacle} from '../world/physics';
import {caveAt,caves,destinations} from './exploration';

/** Cover detection and camera collision share the walkable world's coordinates. */
export function coverAt(x:number,z:number,nearby:Obstacle[]){
 if(caveAt(x,z)||caves.some(c=>Math.abs(x-c.x)<7&&z>=c.z&&z<c.z+12))return 'caverna';
 if(Math.abs(x)<11&&z>19&&z<41)return 'abrigo';
 if(Math.abs(x)<10&&z>-41&&z<-22)return 'refúgio';
 const hut=destinations.find(p=>p.id==='refugio')!;
 if(Math.abs(x-hut.x)<4.4&&Math.abs(z-hut.z)<3.8)return 'abrigo';
 if(nearby.some(o=>o.canopy&&Math.hypot(x-o.x,z-o.z)<o.canopy+1.1))return 'copa';
 return '';
}
/** Sweep a short third-person boom against solid bounds; preserve a safety margin. */
export function cameraBoom(x:number,z:number,yaw:number,wanted:number,query:(x:number,z:number,radius?:number)=>Obstacle[]){
 const dx=Math.sin(yaw),dz=Math.cos(yaw);
 for(let d=.35;d<=wanted;d+=.12){
  const cx=x+dx*d,cz=z+dz*d;
  if(query(cx,cz,.7).some(o=>Math.abs(cx-o.x)<o.width/2+.28&&Math.abs(cz-o.z)<o.depth/2+.28))return Math.max(.3,d-.24);
 }
 return wanted;
}

/** Match the orthographic frame at b=0 and dolly continuously into the close lens. */
export function coveredFraming(blend:number,outdoorSpan:number,boom:number){
 const b=Math.max(0,Math.min(1,blend)),horizontal=Math.exp(Math.log(300)*(1-b)+Math.log(Math.max(.3,boom))*b);
 const rise=horizontal*((1-b)/Math.sqrt(2)+b*1.2/Math.max(.3,boom));
 const half=Math.exp(Math.log(outdoorSpan/2)*(1-b)+Math.log(Math.hypot(boom,1.2)*Math.tan(65*Math.PI/360))*b);
 return {horizontal,rise,fov:2*Math.atan(half/Math.hypot(horizontal,rise))*180/Math.PI};
}
