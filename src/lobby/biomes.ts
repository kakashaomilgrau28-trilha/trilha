export type BiomeId='tropical'|'desert'|'savanna'|'tundra'|'taiga'|'ice';
export const biomes=[
 {id:'tropical',name:'Floresta tropical',color:'#64865a',temperature:30,night:24,thirst:1.15,food:1.5,trees:1,risk:'Umidade, água contaminada e emboscadas ao entardecer.',weather:'Chuva tropical',x:260,z:30},
 {id:'desert',name:'Deserto',color:'#d1b27c',temperature:43,night:3,thirst:3.4,food:.2,trees:0,risk:'Calor durante o dia; frio à noite. Prepare água antes da travessia.',weather:'Tempestade de areia',x:135,z:240},
 {id:'savanna',name:'Savana',color:'#a9a36c',temperature:32,night:17,thirst:1.8,food:.8,trees:.15,risk:'Campo aberto e predadores noturnos; poucos poços na seca.',weather:'Chuva de estação',x:-145,z:245},
 {id:'tundra',name:'Tundra',color:'#b4bcb0',temperature:-12,night:-25,thirst:.8,food:.25,trees:0,risk:'Permafrost, vento e ferimentos agravados pelo frio.',weather:'Neve e vento',x:-280,z:0},
 {id:'taiga',name:'Taiga',color:'#59745f',temperature:5,night:-10,thirst:1,food:.5,trees:.8,risk:'Coníferas, madeira abundante e comida escassa no inverno.',weather:'Tempestade boreal',x:-140,z:-250},
 {id:'ice',name:'Calota polar',color:'#dce9e9',temperature:-28,night:-39,thirst:.9,food:.08,trees:0,risk:'Gelo fino e nevascas. Alimento depende de pesca ou caça.',weather:'Nevasca',x:140,z:-260},
] as const;
export function biomeAt(x:number,z:number){if(Math.hypot(x,z)<60)return biomes[0];const a=(Math.atan2(z,x)+Math.PI/6+Math.PI*2)%(Math.PI*2);return biomes[Math.floor(a/(Math.PI/3))%6]}
export function biomeColor(x:number,z:number,h=0){if(Math.hypot(x,z)<48)return '#8ca476';const b=biomeAt(x,z);return h>38&&b.id!=='ice'?b.id==='desert'?'#c4a47b':'#a6ada2':b.color}
export const polarRegion=(x:number,z:number)=>x>Math.abs(z)*.65?'antarctic':'arctic';
export const seasons=['Primavera','Verão','Outono','Inverno'];
export const DAY_SECONDS=720;
export function worldClimate(time:number,x:number,z:number){
 const b=biomeAt(x,z),day=Math.floor(time/DAY_SECONDS)+1,hour=(time%DAY_SECONDS)/DAY_SECONDS*24,night=hour<6||hour>=18,season=Math.floor((day-1)/4)%4,dry=day%8>=4;
 const hash=Math.sin(Math.floor(time/120)*12.9898+78.233)*43758.5453;const event=hash-Math.floor(hash)>.78,weather=event?(b.id==='tropical'||b.id==='savanna'?'Enchente no vale':b.weather):b.id==='savanna'?(dry?'Estação seca':'Estação chuvosa'):b.id==='tropical'&&Math.floor(time/90)%3===1?'Chuva tropical':'Tempo estável';
 return {biome:b,day,hour,night,season,dry,weather,storm:event,temp:(night?b.night:b.temperature)+(season===3?-8:season===1?4:0)-(event?b.id==='desert'?0:5:0),wind:{x:Math.sin(time/180),z:Math.cos(time/180)}};
}
