import type {WebGLRenderer} from 'three';

/** Local, opt-in diagnostics. No telemetry is sent to a server. */
export function frameProfiler(renderer:WebGLRenderer,host:HTMLElement){
 let previous=0,elapsed=0,frames:number[]=[];
 const sample = (now:number)=>{
  if(document.hidden){previous=0;frames=[];elapsed=0;return}
  if(previous){const dt=now-previous;if(dt>0&&dt<10000){frames.push(dt);elapsed+=dt}}
  previous=now;
  if(elapsed<3000)return;
  const ordered=frames.slice().sort((a,b)=>a-b);
  host.dataset.performance=JSON.stringify({
   fps:Math.round(frames.length/elapsed*1000*10)/10,
   p95:Math.round(ordered[Math.floor(ordered.length*.95)]*10)/10,
   samples:frames.length,calls:renderer.info.render.calls,
   triangles:renderer.info.render.triangles,
   geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
   resolution:`${renderer.domElement.width}×${renderer.domElement.height}`,
   dpr:renderer.getPixelRatio(),
  });
  frames=[];elapsed=0;
 };
 return Object.assign(sample,{reset(){previous=0;frames=[];elapsed=0}});
}
