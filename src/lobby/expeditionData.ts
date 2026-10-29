import {biomes,type BiomeId,biomeAt,polarRegion} from './biomes';
export type ResourceKind='wood'|'stone'|'fiber'|'herb'|'fruit'|'water'|'fish';
export type ResourceNode={id:string;kind:ResourceKind;x:number;z:number;amount:number;clean?:boolean;biome:BiomeId;name:string};
export const nodes:ResourceNode[]=[{id:'antarctic-sea',kind:'fish',x:280,z:-240,amount:3,biome:'ice',name:'Beira do gelo antártico'},{id:'base-water',kind:'water',x:8,z:8,amount:999,clean:true,biome:'tropical',name:'Água tratada da base'},...biomes.flatMap((b,i)=>{
 const a=i*Math.PI/3,parts:ResourceNode[]=[];
 for(let j=0;j<10;j++){const r=100+j*23,angle=a+Math.sin(j*2.3)*.24,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
 const kind:ResourceKind=j===5?'water':j===8?'fish':b.id==='ice'?'stone':b.id==='desert'?(j%3===0?'herb':j%3===1?'stone':'fiber'):b.id==='tundra'?(j%3===0?'herb':j%3===1?'stone':'fiber'):(['wood','fiber','stone','fruit','herb'] as ResourceKind[])[j%5];
 parts.push({id:b.id+'-'+j,kind,x,z,amount:kind==='water'?8:kind==='fish'?4:3,clean:kind==='water',biome:b.id,name:kind==='water'?(b.id==='ice'?'Fonte termal protegida':b.id==='desert'?'Nascente do oásis':'Nascente protegida'):kind==='fish'?'Ponto de pesca':({wood:'Madeira caída',fiber:'Fibras secas',stone:'Pedras soltas',fruit:'Frutos silvestres',herb:'Ervas de campo'} as Record<string,string>)[kind]});
 }return parts;
})];
export const camps=[{id:'base',name:'Base Trilha',x:0,z:8},{id:'taiga-camp',name:'Acampamento boreal',x:-145,z:-220},{id:'savanna-camp',name:'Acampamento do vale',x:-140,z:220}];
export const landmarks=[{id:'ruin',name:'Ruínas do Observatório',x:285,z:65},{id:'journal-1',name:'Página do rio',x:-170,z:120},{id:'journal-2',name:'Página da serra',x:245,z:-230},{id:'journal-3',name:'Página das ruínas',x:285,z:65},{id:'final',name:'Farol dos Seis Ventos',x:350,z:-280},{id:'explorer',name:'Milena · exploradora',x:9,z:14}];
export const missions=[
 ['Mapear cinco regiões','Explore cinco biomas além da base.','visited',5,'2 rações e 1 bandagem'],
 ['Olhar do alto','Alcance o Cume das Araucárias para revelar seus arredores.','viewpoint',1,'1 ração'],
 ['Até o fundo da gruta','Chegue à câmara final de uma das cavernas.','cave',1,'2 ervas'],
 ['Água nos seis biomas','Encontre uma nascente potável em cada bioma.','sources',6,'2 kits médicos'],
 ['Memória das ruínas','Localize as ruínas e recolha o artefato.','artifact',1,'2 fibras'],
 ['Uma noite segura','Durma até amanhecer num acampamento sem carne exposta nem predador por perto.','safeNight',1,'2 rações'],
 ['Refeição de campo','Acenda uma fogueira e cozinhe peixe ou carne.','cooked',1,'2 bandagens'],
 ['Reserva de recursos','Colete dez unidades de madeira, pedra, fibras ou ervas.','gathered',10,'1 ração'],
 ['Ferramenta de confiança','Fabrique machado, corda ou tocha.','crafted',1,'2 rações'],
 ['O alimento do dia','Pesque ou cace e guarde alimento no inventário.','protein',1,'1 kit médico'],
 ['Travessia do rio','Cruze o riacho nadando, sem descartar equipamento nem se afogar.','river',1,'1 ração'],
 ['Subida das Araucárias','Suba pelo menos 20 m de desnível a pé nesta montanha e alcance o pico com seus próprios recursos.','summit',1,'2 rações'],
 ['Preparado para os extremos','Cruze 180 m de deserto ou gelo com sede e fome acima de zero.','extreme',180,'1 roupa térmica'],
 ['O segredo das ruínas','Nas ruínas, alinhe os símbolos na sequência anotada nas páginas do diário.','puzzle',1,'1 kit médico'],
 ['Distância de segurança','Rompa uma perseguição de animal e saia do território.','escaped',1,'1 bandagem'],
 ['Conversa de exploradores','Fale com Milena na base para receber a missão do farol.','npc',1,'2 rações'],
 ['Diário fragmentado','Recupere as três páginas nas ruínas, no rio e na serra.','journal',3,'2 rações'],
 ['Antes que o tempo vire','Com o diário e a passagem abertos, alcance o farol até o final do dia 6.','final',1,'Distintivo dos Seis Ventos'],
].map(([name,description,key,target,reward],i)=>({id:i+1,name:String(name),description:String(description),key:String(key),target:Number(target),reward:String(reward)}));
export type Species={id:string;name:string;biome:BiomeId;shape:'cat'|'dog'|'bear'|'snake'|'spider'|'croc'|'insect'|'elephant'|'hippo'|'seal'|'fish';color:string;size:number;speed:number;damage:number;radius:number;chase:number;nocturnal:boolean;fire:boolean;water:boolean;injury:'bleeding'|'poison'|'infection';defensive:boolean;pack?:number};
export const species:Species[]=[
 ['jaguar','Onça-pintada','tropical','cat','#bd914d',1,7,19,18,35,true,true,false,'bleeding',false],
 ['jararaca','Jararaca','tropical','snake','#7d7654',.7,1,10,1.5,2,false,false,false,'poison',true],
 ['surucucu','Surucucu','tropical','snake','#9d8254',1,1,13,1.5,2,true,false,false,'poison',true],
 ['spider','Aranha','tropical','spider','#514738',.35,1,6,1.2,2,true,false,false,'poison',true],
 ['caiman','Jacaré','tropical','croc','#526b4d',1.3,5,18,5,14,false,false,true,'bleeding',true],
 ['piranha','Piranhas','tropical','fish','#78858a',.4,3,7,3,9,false,false,true,'bleeding',true],
 ['insects','Enxame de insetos','tropical','insect','#b3a66b',.5,3,2,3,7,false,true,false,'infection',true],
 ['scorpion','Escorpião','desert','spider','#8e6f44',.5,1,9,1.3,2,true,false,false,'poison',true],
 ['rattlesnake','Cascavel','desert','snake','#ac8e5b',.8,1,12,1.5,2,true,false,false,'poison',true],
 ['desert-spider','Aranha do deserto','desert','spider','#755d46',.35,1,6,1,2,true,false,false,'poison',true],
 ['lion','Leão','savanna','cat','#bb9554',1.2,7,22,19,42,true,true,false,'bleeding',false,2],
 ['hyena','Hiena','savanna','dog','#9f936f',.9,6,14,18,38,true,true,false,'bleeding',false,3],
 ['elephant','Elefante','savanna','elephant','#7f8379',2.6,6,32,7,20,false,false,false,'bleeding',true],
 ['hippo','Hipopótamo','savanna','hippo','#817e78',1.7,6,28,6,22,false,false,true,'bleeding',true],
 ['crocodile','Crocodilo','savanna','croc','#697358',1.6,5,24,6,16,true,false,true,'bleeding',true],
 ['tundra-wolf','Lobo','tundra','dog','#a0a59e',1,6,15,20,40,true,true,false,'bleeding',false,3],
 ['tundra-bear','Urso-pardo','tundra','bear','#79674e',1.6,6,28,8,28,false,false,false,'bleeding',true],
 ['fox','Raposa','tundra','dog','#c8b69c',.6,4,4,1.5,5,false,true,false,'infection',true],
 ['brown-bear','Urso-pardo','taiga','bear','#715842',1.6,6,26,8,30,false,false,false,'bleeding',true],
 ['black-bear','Urso-negro','taiga','bear','#394037',1.35,5,21,7,25,false,true,false,'bleeding',true],
 ['taiga-wolf','Lobo','taiga','dog','#899389',1,6,15,18,38,true,true,false,'bleeding',false,3],
 ['lynx','Lince','taiga','cat','#b5a281',.8,5,10,4,15,true,true,false,'bleeding',true],
 ['polar-bear','Urso-polar','ice','bear','#dedecb',1.9,6,32,28,55,false,false,true,'bleeding',false],
 ['leopard-seal','Foca-leopardo','ice','seal','#a1a8a4',1.5,4,22,5,14,false,false,true,'bleeding',true],
].map(a=>({id:a[0],name:a[1],biome:a[2],shape:a[3],color:a[4],size:a[5],speed:a[6],damage:a[7],radius:a[8],chase:a[9],nocturnal:a[10],fire:a[11],water:a[12],injury:a[13],defensive:a[14],pack:a[15]} as Species));
export const animalSpawns=species.flatMap((s,i)=>{const b=biomes.find(b=>b.id===s.biome)!,angle=biomes.indexOf(b)*Math.PI/3+((i%3)-1)*.18,r=210+(i%4)*38;let x=Math.cos(angle)*r,z=Math.sin(angle)*r;
 if(s.id==='polar-bear'){x=55;z=-350}if(s.id==='leopard-seal'){x=280;z=-240}
 if(s.water&&s.shape!=='bear'){const n=nodes.find(n=>n.biome===s.biome&&n.kind==='fish');if(n&&s.biome!=='ice'){x=n.x+(s.shape==='fish'?0:6);z=n.z+(s.shape==='fish'?0:2)}}
 return Array.from({length:s.pack??1},(_,j)=>({id:s.id+'-'+j,species:s,x:x+j*2.5,z:z+j*2}));});
export function speciesAllowed(s:Species,x:number,z:number){return biomeAt(x,z).id===s.biome&&(s.id!=='polar-bear'||polarRegion(x,z)==='arctic')&&(s.id!=='leopard-seal'||polarRegion(x,z)==='antarctic')}
