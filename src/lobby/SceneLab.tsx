import {useState} from 'react';
import LobbyWorld from './LobbyWorld';
import {caves,terrainHeight,discoveries,ropeCrossing} from './exploration';
import {biomes} from './biomes';
import {animalSpawns} from './expeditionData';
import './lobby.css';
import './expedition.css';
/** Development-only fixture. Not reachable in production builds. */
export default function SceneLab(){
 const positions=[{name:'Acampamento',x:0,z:8},{name:'Entrada dos Cristais',x:caves[0].x,z:caves[0].z+10},{name:'Galeria dos Cristais',x:caves[0].x,z:caves[0].z-18},{name:'Câmara dos Cristais',x:caves[0].x,z:caves[0].z-caves[0].length+4},{name:'Entrada do Eco',x:caves[1].x,z:caves[1].z+10},{name:'Cume',x:245,z:-230},{name:'Lago / reabastecer',x:-19,z:18},{name:'Ancoragem da ravina',x:ropeCrossing.from.x,z:ropeCrossing.z},{name:'Abrigo do campamento',x:0,z:30},{name:'Mata Fechada',x:195,z:-90},{name:'Abrigo dos Pioneiros',x:-210,z:270},...biomes.map(b=>({name:b.name,x:b.x,z:b.z})),{name:'Helena',x:9,z:14},{name:'Ruínas',x:285,z:70},{name:'Território de urso',x:animalSpawns.find(a=>a.species.id==='brown-bear')!.x+5,z:animalSpawns.find(a=>a.species.id==='brown-bear')!.z}];
 const [index]=useState(()=>Math.max(0,Math.min(positions.length-1,Number(new URLSearchParams(location.search).get('scene'))||0))),[item,setItem]=useState('mapa'),[found,setFound]=useState<string[]>([]);
 const p=positions[index];
 return <main className="camp-app expedition-app" style={{display:'block',padding:12}}><label style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>Cena de desenvolvimento <select aria-label="Local de teste" value={index} onChange={e=>{location.search=`?scene=${Number(e.target.value)}`}}>{positions.map((p,i)=><option key={p.name} value={i}>{p.name}</option>)}</select><span>Cota {Math.round(terrainHeight(p.x,p.z))} m · {found.length}/{discoveries.length}</span></label><LobbyWorld fixture key={index} initialPosition={p} profile={{nickname:'Explorador',avatar:'trilheiro',club:''}} players={[]} item={item} onEquip={setItem} foundIds={found} onDiscover={r=>setFound(v=>v.includes(r.id)?v:[...v,r.id])} gesture="" paused={false} vip={false} onMove={()=>{}} onPlayer={()=>{}} onVip={()=>{}}/></main>;
}

