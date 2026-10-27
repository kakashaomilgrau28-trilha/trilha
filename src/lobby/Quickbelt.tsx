import {memo} from 'react';
import {Map,Bike,Dog,Flashlight,Droplets,Link,Compass,Binoculars,Footprints,HardHat} from 'lucide-react';
export const fieldGear=[
 {id:'mapa',name:'Mapa de campo',icon:Map},{id:'bicicleta',name:'Bicicleta',icon:Bike},
 {id:'pet',name:'Companheiro',icon:Dog},{id:'lanterna',name:'Lanterna',icon:Flashlight},
 {id:'cantil',name:'Cantil',icon:Droplets},{id:'corda',name:'Corda',icon:Link},
 {id:'bussola',name:'Bússola',icon:Compass},{id:'binoculos',name:'Binóculos',icon:Binoculars},
 {id:'botas',name:'Botas',icon:Footprints},{id:'capacete',name:'Capacete com luz',icon:HardHat},
];
export default memo(function Quickbelt({item,onEquip}:{item:string;onEquip:(id:string)=>void}){
 return <nav className="quickbelt" aria-label="Mochila de acesso rápido">{fieldGear.map(({id,name,icon:Icon},i)=><button key={id} aria-label={`Equipar ${name} · tecla ${(i+1)%10}`} aria-pressed={item===id} title={name} onClick={()=>onEquip(item===id?'':id)}><kbd>{(i+1)%10}</kbd><Icon size={21}/><span>{name}</span></button>)}</nav>;
});
