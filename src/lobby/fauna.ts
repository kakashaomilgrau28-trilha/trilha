import {animalSpawns,type Species} from './expeditionData';
import {worldClimate} from './biomes';
import {damage,foodSmell,fireNear,campNear,atBase,progress,note,type Expedition} from './survival';
export type Animal={id:string;species:Species;x:number;z:number;homeX:number;homeZ:number;mode:'roam'|'alert'|'pursue'|'retreat'|'distracted'|'dead';timer:number;cooldown:number;health:number;heading:number;chased:boolean;cub?:{x:number;z:number};target?:{x:number;z:number}};
export const createFauna=():Animal[]=>animalSpawns.map(a=>({...a,homeX:a.x,homeZ:a.z,mode:'roam',timer:0,cooldown:0,health:a.species.shape==='bear'?120:a.species.size>2?180:70,heading:0,chased:false,cub:a.species.defensive&&['bear','elephant'].includes(a.species.shape)?{x:a.x+3,z:a.z+2}:undefined}));
export function stepFauna(animals:Animal[],s:Expedition,dt:number,p:{x:number;z:number;running:boolean;sneaking:boolean;swimming:boolean;tree:boolean;light?:boolean},move:(a:Animal,x:number,z:number,speed:number,dt:number)=>void){
 const c=worldClimate(s.time,p.x,p.z),smell=foodSmell(s);
 for(const a of animals){if(a.mode==='dead'||Math.hypot(a.x-p.x,a.z-p.z)>110)continue;a.timer+=dt;a.cooldown=Math.max(0,a.cooldown-dt);
 const sp=a.species,d=Math.hypot(a.x-p.x,a.z-p.z),fromHome=Math.hypot(p.x-a.homeX,p.z-a.homeZ),downwind=((a.x-p.x)*c.wind.x+(a.z-p.z)*c.wind.z)>0;
 const scent=smell*(downwind?6:1)+(s.baits??[]).reduce((n,b)=>n+(Math.hypot(b.x-a.x,b.z-a.z)<30?b.strength*4:0),0),noise=p.sneaking?.35:p.running?1.6:1,active=!sp.nocturnal||c.night||c.hour>16,detect=(sp.radius*noise*(active?1:.35)+scent)*(s.activity?.kind==='sleep'&&!campNear(s,p.x,p.z)?1.6:1)*(c.season===3&&sp.shape==='dog'?1.3:1);
 const cubDistance=a.cub?Math.hypot(a.cub.x-p.x,a.cub.z-p.z):Infinity,packAlert=!!sp.pack&&animals.some(other=>other!==a&&other.species.id===sp.id&&other.mode==='pursue'&&Math.hypot(other.x-a.x,other.z-a.z)<16);
 const protectedSpace=sp.shape==='fish'&&!p.swimming||atBase(p.x,p.z)||((fireNear(s,p.x,p.z)||s.torchLit)&&sp.fire)||(p.light&&sp.fire&&['cat','dog'].includes(sp.shape)&&d>5)||(p.tree&&['dog','croc','snake','spider','elephant','hippo','insect'].includes(sp.shape));
 if(a.mode==='distracted'){if(a.timer>12){a.mode='retreat';a.timer=0}else if(a.target)move(a,a.target.x,a.target.z,sp.speed*.5,dt);continue}
 if(a.mode==='roam'){
  if(!protectedSpace&&a.cooldown===0&&(d<detect||cubDistance<9||packAlert)&&(!sp.defensive||d<sp.radius||cubDistance<9||smell>1&&d<sp.radius+5)&&(sp.id!=='piranha'||p.swimming&&(s.bleeding>0||c.dry))){a.mode='alert';a.timer=0;note(s,sp.name+(cubDistance<9?' está protegendo uma cria e':'')+' percebeu sua presença. Afaste-se sem correr na direção dele.');}
  else move(a,a.homeX+Math.cos(s.time*.035+a.homeX)*5,a.homeZ+Math.sin(s.time*.035+a.homeX)*5,sp.speed*.16,dt);
 }else if(a.mode==='alert'){
  a.heading=Math.atan2(p.x-a.x,p.z-a.z);
  if(protectedSpace||d>detect+6){a.mode='retreat';a.timer=0}
  else if(a.timer>2.5){a.mode='pursue';a.timer=0;a.chased=true;note(s,sp.name+' avançou. Use distância, abrigo ou uma distração adequada à espécie.');}
 }else if(a.mode==='pursue'){
  if(protectedSpace||fromHome>sp.chase||d>sp.chase+5){a.mode='retreat';a.timer=0;if(a.chased){s.progress.escaped=1;note(s,'Você despistou '+sp.name+'. O território continua perigoso.');a.chased=false}}
  else{const stop=Math.max(1.35,sp.size*.75+.65);a.heading=Math.atan2(p.x-a.x,p.z-a.z);if(d>stop)move(a,p.x+(a.x-p.x)/d*stop,p.z+(a.z-p.z)/d*stop,sp.speed,dt);if(d<stop+.3&&a.cooldown<=0){damage(s,sp.damage,'Ataque de '+sp.name);s[sp.injury]=Math.min(100,s[sp.injury]+(sp.injury==='poison'?24:sp.injury==='infection'?12:20));s.injured=Math.min(100,s.injured+10);a.cooldown=5;note(s,sp.name+': ferimento e '+({poison:'envenenamento',bleeding:'sangramento',infection:'infecção'})[sp.injury]+'. Trate antes de seguir.');}}
 }else if(a.mode==='retreat'){move(a,a.homeX,a.homeZ,sp.speed*.5,dt);if(Math.hypot(a.x-a.homeX,a.z-a.homeZ)<2){a.mode='roam';a.timer=0;a.cooldown=25}}
 }
}
export function distract(animals:Animal[],s:Expedition,x:number,z:number){const key=s.inventory.rawMeat?'rawMeat':s.inventory.fish?'fish':s.inventory.ration?'ration':'';if(!key)return note(s,'Você não tem alimento para uma distração.');const a=animals.filter(a=>a.mode!=='dead'&&!a.species.defensive).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];if(!a||Math.hypot(a.x-x,a.z-z)>30)return note(s,'Nenhum predador interessado está próximo.');s.inventory[key]--;a.mode='distracted';a.timer=0;a.target={x:a.x+(a.x-x)*.4,z:a.z+(a.z-z)*.4};return note(s,'Alimento lançado. Afaste-se enquanto o animal investiga.');}
export function huntHit(a:Animal,s:Expedition,x:number,z:number){if(a.mode==='dead'||Math.hypot(a.x-x,a.z-z)>16)return note(s,'O animal saiu do alcance.');if(s.durability.bow<25)return note(s,'O arco está quebrado. Fabrique outro.');s.durability.bow-=25;a.health-=45;a.mode='pursue';a.chased=true;if(a.health<=0){a.mode='dead';s.inventory.rawMeat=(s.inventory.rawMeat??0)+2;s.inventory.hide=(s.inventory.hide??0)+1;progress(s,'protein');s.ledger['animal:'+a.id]={remaining:0,readyAt:Date.now()+24*60*1000};return note(s,'Caça concluída. Carne crua atrai predadores: cozinhe ou acondicione.')}return note(s,'O animal foi ferido e reagiu. Não conte com um disparo para derrubá-lo.');}
