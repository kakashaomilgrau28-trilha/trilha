import {useEffect,useState} from 'react';
export type HudPanel='status'|'equipment'|'map'|'notices'|'belt';
const closed={status:false,equipment:false,map:false,notices:false,belt:false};
const narrow=()=>window.matchMedia('(max-width: 800px), (max-height: 500px) and (pointer: coarse)').matches;
export function useHudPanels(){
 const [storageKey]=useState(()=>`trilha.hud.panels.v1.${narrow()?'touch':'wide'}`);
 const [panels,setPanels]=useState(()=>{const defaults=narrow()?closed:{status:true,equipment:true,map:true,notices:true,belt:true};try{const data=JSON.parse(localStorage.getItem(storageKey)||'null');return Object.fromEntries(Object.keys(closed).map(k=>[k,typeof data?.[k]==='boolean'?data[k]:defaults[k as HudPanel]])) as typeof closed}catch{return defaults}});
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(panels))}catch{}},[panels,storageKey]);
 const toggle=(panel:HudPanel)=>setPanels(p=>({...p,...(narrow()&&panel!=='belt'?{status:false,equipment:false,map:false,notices:false}:{}),[panel]:!p[panel]}));
 const minimize=(panel:HudPanel)=>setPanels(p=>({...p,[panel]:false}));
 const minimized=Object.values(panels).every(v=>!v);
 const toggleAll=()=>setPanels(minimized?(narrow()?{...closed,belt:true,status:true}:{status:true,equipment:true,map:true,notices:true,belt:true}):closed);
 return {panels,toggle,minimize,minimized,toggleAll};
}
