import {memo,useMemo,useState,useRef,useEffect} from 'react';
import * as T from 'three';
import {SIZE,BOUNDARY,surfaceHeight as terrainHeight,caveRoute,riverPoints,trails,caves,ropeCrossing} from './exploration';
import {places} from './scene';
import {getForestLayout} from './landscape';

type Props={x:number;z:number;heading:number;expanded:boolean;onNavigate:(p:{x:number;z:number;name:string})=>void;onToggle:()=>void};
let cachedTerrain:string;
function FieldMap({x,z,heading,expanded,onToggle,onNavigate}:Props){
 const [zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,z:0}),[selected,setSelected]=useState('');
 const [drag,setDrag]=useState<{id:number;x:number;y:number;px:number;pz:number}|null>(null);
 const svg=useRef<SVGSVGElement>(null),[pixels,setPixels]=useState(300);
 useEffect(()=>{if(!svg.current)return;const observer=new ResizeObserver(([e])=>setPixels(Math.max(1,Math.min(e.contentRect.width,e.contentRect.height))));observer.observe(svg.current);return()=>observer.disconnect()},[]);
 const terrain=useMemo(()=>{
  if(cachedTerrain)return cachedTerrain;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!,image=ctx.createImageData(256,256),levels=new Float32Array(256*256);
  for(let j=0;j<256;j++)for(let i=0;i<256;i++)levels[j*256+i]=terrainHeight((i/255-.5)*SIZE,(j/255-.5)*SIZE);
  for(let j=0;j<256;j++)for(let i=0;i<256;i++){
   const n=j*256+i,h=levels[n],contour=i>0&&Math.floor(h/10)!==Math.floor(levels[n-1]/10)||j>0&&Math.floor(h/10)!==Math.floor(levels[n-256]/10);
   const color=new T.Color(h>36?'#bcbfb1':h>23?'#85907b':h>12?'#7c9369':'#8ca476');
   color.multiplyScalar(contour ? .76 : 1).convertLinearToSRGB();image.data[n*4]=color.r*255;image.data[n*4+1]=color.g*255;image.data[n*4+2]=color.b*255;image.data[n*4+3]=255;
  }
  ctx.putImageData(image,0,0);
  ctx.fillStyle='#34583b88';for(const tree of getForestLayout()){ctx.beginPath();ctx.arc((tree.x/SIZE+.5)*256,(tree.z/SIZE+.5)*256,2.7*tree.s/SIZE*256,0,Math.PI*2);ctx.fill()}
  return cachedTerrain=canvas.toDataURL();
 },[]);
 const routes=useMemo(()=>trails.map(t=>({...t,path:new T.CatmullRomCurve3(t.points.map(([a,b])=>new T.Vector3(a,0,b))).getPoints(240).map(p=>`${p.x},${p.z}`).join(' ')})),[]);
 const river=useMemo(()=>new T.CatmullRomCurve3(riverPoints.map(([a,b])=>new T.Vector3(a,0,b))).getPoints(180).map(p=>`${p.x},${p.z}`).join(' '),[]);
 const span=expanded?(BOUNDARY*2+40)/zoom:115,cx=expanded?pan.x:x,cz=expanded?pan.z:z;
 const px=span/pixels,markers=expanded&&zoom<2.5?places.filter(p=>p.id==='fogueira'||Math.hypot(p.x,p.z)>45):places;
 function choosePoint(clientX:number,clientY:number,fallback:string){
  const matrix=svg.current?.getScreenCTM();if(!matrix){setSelected(fallback);return}
  const point=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());
  const closest=markers.reduce((a,b)=>Math.hypot(a.x-point.x,a.z-point.y)<Math.hypot(b.x-point.x,b.z-point.y)?a:b);
  setSelected(closest.id);
 }
 const destination=places.find(p=>p.id===selected),unit=span>600?200:span>200?50:10;
 return <div className={`field-map detailed-map ${expanded?'is-open':''}`}>
  <button className="field-map-toggle" onClick={onToggle} aria-expanded={expanded}>{expanded?'Fechar mapa de localização':'Abrir mapa de localização'} <span>↗</span></button>
  {expanded&&<div className="atlas-tools"><button onClick={()=>setZoom(v=>Math.min(12,v*1.5))} aria-label="Ampliar mapa">+</button><button onClick={()=>setZoom(v=>Math.max(1,v/1.5))} aria-label="Reduzir mapa">−</button><button onClick={()=>{setPan({x,z});setZoom(6)}}>Minha posição</button><button onClick={()=>{setPan({x:0,z:0});setZoom(1)}}>Toda a região</button></div>}
  <svg ref={svg} className="atlas-canvas" viewBox={`${cx-span/2} ${cz-span/2} ${span} ${span}`} role="img" aria-label="Mapa topográfico do cenário: relevo, trilhas, acampamento, água e cavernas" onPointerDown={e=>{if(!expanded||(e.target as Element).closest('[data-map-marker]'))return;e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);setDrag({id:e.pointerId,x:e.clientX,y:e.clientY,px:pan.x,pz:pan.z})}} onPointerMove={e=>{if(drag?.id!==e.pointerId)return;const r=e.currentTarget.getBoundingClientRect();setPan({x:Math.max(-SIZE/2,Math.min(SIZE/2,drag.px-(e.clientX-drag.x)*span/Math.min(r.width,r.height))),z:Math.max(-SIZE/2,Math.min(SIZE/2,drag.pz-(e.clientY-drag.y)*span/Math.min(r.width,r.height)))})}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)} onWheel={e=>{e.stopPropagation();if(expanded)setZoom(v=>Math.max(1,Math.min(12,v*(e.deltaY>0?.85:1.15))))}}>
   <image href={terrain} x={-SIZE/2} y={-SIZE/2} width={SIZE} height={SIZE}/>
   <rect x={-BOUNDARY} y={-BOUNDARY} width={BOUNDARY*2} height={BOUNDARY*2} fill="none" stroke="#445440" strokeWidth={span*.0015} strokeDasharray="6 4"/>
   <polyline points={river} fill="none" stroke="#5d999c" strokeWidth={8}/>
   <path d="M -42 -12 C -45 -36 -23 -40 -7 -39 C 16 -42 39 -34 42 -10 C 49 10 30 40 9 43 C -15 45 -44 33 -42 -12" fill="#b3bd8c"/>
   <rect x={-7.5} y={24} width={15} height={12} fill="#49614a"/>
   <ellipse cx={-25} cy={22} rx={10} ry={13} fill="#659c9b"/>
   <rect x={-21} y={11.76} width={4} height={6.5} fill="#aa875d"/>
   {[[-23,-18],[-31,-22],[-22,-27]].map(([a,b])=><path key={a+':'+b} d={`M ${a-2} ${b+2} L ${a} ${b-2} L ${a+2} ${b+2} Z`} fill="#9e714a"/>)}
   <rect x={-7} y={-38} width={14} height={12} fill="#56715a"/>
   <rect x={20.5} y={-24.5} width={7} height={3} fill="#b18c60"/><circle cx={25} cy={18} r={6} fill="#c2a37a"/><circle r={2.2} fill="#bb7142"/>
   {routes.map(t=><g key={t.name}><polyline points={t.path} fill="none" stroke="#eee0bb" strokeWidth={t.width+span*.001}/><polyline points={t.path} fill="none" stroke="#957447" strokeWidth={Math.max(.6,span*.001)} strokeDasharray={t.width<3?'3 2':undefined}/></g>)}
   {caves.map(c=><g key={c.id}><polyline points={caveRoute(c).map(p=>p.join(',')).join(' ')} fill="none" stroke="#555b51" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"/><circle cx={c.x} cy={c.z-c.length+4} r={9} fill="#555b51"/></g>)}
   <path d={`M ${ropeCrossing.from.x} ${ropeCrossing.z} H ${ropeCrossing.to.x}`} stroke="#674339" strokeWidth={5} strokeDasharray="2 2"/>
   {markers.map(p=><g key={p.id} data-map-marker="true" role="button" tabIndex={expanded?0:-1} aria-label={p.id==='fogueira'&&zoom<2.5?'Acampamento':p.name} transform={`translate(${p.x} ${p.z})`} onClick={e=>{e.stopPropagation();choosePoint(e.clientX,e.clientY,p.id)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(p.id)}}} style={{cursor:'pointer'}}>
    <circle r={22*px} fill="transparent"/>
    <circle r={(expanded?10:4)*px} fill={selected===p.id?'#f5c867':'#fff4d9'} stroke="#3a5545" strokeWidth={px}/>
    {expanded&&<text textAnchor="middle" dominantBaseline="central" fontSize={12*px} fontWeight={700} fill="#263e30" pointerEvents="none">{places.indexOf(p)+1}</text>}
   </g>)}

   <g transform={`translate(${x} ${z}) rotate(${180-heading*180/Math.PI})`}><circle r={span*.013} fill="#f5c867" stroke="#fff" strokeWidth={span*.002}/><path d={`M 0 ${-span*.022} L ${-span*.008} ${span*.005} L 0 0 L ${span*.008} ${span*.005} Z`} fill="#283f32"/></g>
   <text x={cx+span*.43} y={cz-span*.43} fontSize={span*.033} fill="#203f30">N ↑</text>
   <path d={`M ${cx-span*.45} ${cz+span*.44} h ${unit}`} stroke="#244431" strokeWidth={span*.003}/><text x={cx-span*.45} y={cz+span*.42} fontSize={span*.021} fill="#203f30">{unit} m</text>
  </svg>
  {expanded&&<div className="atlas-detail"><b>{destination?.name??'Mapa do terreno explorável'}</b><p>{destination?`${Math.round(Math.hypot(destination.x-x,destination.z-z))} m de distância · cota ${Math.round(terrainHeight(destination.x,destination.z))} m`: 'Arraste para navegar, use + e − para ampliar e toque nos pontos.'}</p>{destination&&<button className="atlas-navigate" onClick={()=>onNavigate(destination)}>Marcar destino · {destination.name}</button>}<small>Curvas: 10 m · marrom: trilha · azul: água · escuro: galeria · dourado: você · tracejado externo: limite explorável</small><div className="atlas-index">{places.map((p,i)=><button key={p.id} onClick={()=>{setSelected(p.id);setPan({x:p.x,z:p.z});setZoom(6)}}>{i+1}. {p.name}</button>)}</div></div>}
 </div>
}

export default memo(FieldMap);
