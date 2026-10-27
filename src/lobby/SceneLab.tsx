import {useState} from 'react';
import LobbyWorld from './LobbyWorld';
import {caves,terrainHeight,discoveries} from './exploration';
import './lobby.css';
import './expedition.css';
/** Development-only fixture. Not reachable in production builds. */
export default function SceneLab(){
 const positions=[{name:'Acampamento',x:0,z:8},{name:'Entrada dos Cristais',x:caves[0].x,z:caves[0].z+10},{name:'Galeria dos Cristais',x:caves[0].x,z:caves[0].z-18},{name:'Câmara dos Cristais',x:caves[0].x,z:caves[0].z-caves[0].length+4},{name:'Entrada do Eco',x:caves[1].x,z:caves[1].z+10},{name:'Cume',x:297,z:-288}];
 const [index,setIndex]=useState(0),[item,setItem]=useState('mapa'),[found,setFound]=useState<string[]>([]);
 const p=positions[index];
 return <main className="camp-app expedition-app" style={{display:'block',padding:12}}><label style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>Cena de desenvolvimento <select aria-label="Local de teste" value={index} onChange={e=>setIndex(Number(e.target.value))}>{positions.map((p,i)=><option key={p.name} value={i}>{p.name}</option>)}</select><span>Cota {Math.round(terrainHeight(p.x,p.z))} m · {found.length}/{discoveries.length}</span></label><LobbyWorld key={index} initialPosition={p} profile={{nickname:'Explorador',avatar:'trilheiro',club:''}} players={[]} item={item} onEquip={setItem} foundIds={found} onDiscover={r=>setFound(v=>v.includes(r.id)?v:[...v,r.id])} gesture="" paused={false} vip={false} onMove={()=>{}} onPlayer={()=>{}} onVip={()=>{}}/></main>;
}
