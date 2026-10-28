export const PREVIOUS_AREA_MULTIPLIER = 15;
export const EXPANSION = Math.sqrt(10);
export const AREA_MULTIPLIER = PREVIOUS_AREA_MULTIPLIER * 10;
export const SIZE = 100 * Math.sqrt(AREA_MULTIPLIER);
export const BOUNDARY = 38 * Math.sqrt(AREA_MULTIPLIER);
export const mapPercent = (metres: number, span = SIZE) => metres / span * 100 + 50;
const codes: Record<string,string> = {fogueira:'F',acampamento:'B',oficina:'O',lago:'L',observatorio:'M',vip:'V',cume:'C',pedras:'S',rio:'R',flores:'P',refugio:'A',cachoeira:'Q'};
export const mapCode = (id:string) => codes[id] ?? '?';
/** A valley between two ridges. The camp stays level; elevations spread gradually. */
const rawTerrain = (x:number,z:number) => {
 const edge=Math.min(1,Math.max(0,(Math.hypot(x,z)-43)/55)),fade=edge*edge*(3-2*edge);
 const hill=(cx:number,cz:number,h:number,r:number)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
 let h=fade*(hill(245,-230,58,100)+hill(-245,-255,43,105)+hill(210,205,22,120)+hill(-210,270,18,100)+1.5+1.3*Math.sin(x*.015)*Math.cos(z*.012))-6*Math.exp(-(((x-135)/9)**4+((z+175)/6)**4));
 let nearest=Infinity,waterHeight=0;
 for(let i=0;i<riverPoints.length-1;i++){
  const a=riverPoints[i],b=riverPoints[i+1],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(d<nearest){nearest=d;waterHeight=12*(1-(i+t)/(riverPoints.length-1));}
 }
 if(nearest<24){const blend=Math.exp(-((nearest/14)**4));h=h*(1-blend)+waterHeight*blend;}
 return h;
};
export const caves = [
  {id:'gruta-cristais',name:'Gruta dos Cristais',x:250,z:155,length:60},
  {id:'caverna-eco',name:'Caverna do Eco',x:-270,z:-155,length:54},
];
export type Cave = typeof caves[number];
export function caveRoute(c:Cave):[number,number][]{return [[c.x,c.z+1],[c.x-1.5,c.z-13],[c.x+2,c.z-28],[c.x-2.5,c.z-43],[c.x,c.z-c.length+4]]}
export function segmentDistance(x:number,z:number,a:number[],b:number[]){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)}
export function caveDistance(c:Cave,x:number,z:number){const route=caveRoute(c);return Math.min(...route.slice(1).map((b,i)=>segmentDistance(x,z,route[i],b)))}
export function caveRoofAt(x:number,z:number){return caves.find(c=>z<c.z+4&&(caveDistance(c,x,z)<20||Math.hypot(x-c.x,z-(c.z-c.length+4))<23))}
export function caveAt(x:number,z:number){return caves.find(c=>z<c.z+1 && (caveDistance(c,x,z)<4.2||Math.hypot(x-c.x,z-(c.z-c.length+4))<9))}
/** Continuous hill mass over the galleries, fading to a walkable southern entrance. */
export function surfaceHeight(x:number,z:number){let h=rawTerrain(x,z);for(const c of caves){const u=(x-c.x)/29,v=(z-c.z+c.length*.43)/(c.length*.65),entrance=Math.min(1,Math.max(0,(c.z-z)/12));h+=23*Math.exp(-u*u-v*v)*entrance}return h}
export function caveFloor(c:Cave,z:number){return rawTerrain(c.x,c.z)-Math.min(2,Math.max(0,(c.z-z)*.035))}
export const terrainHeight=(x:number,z:number)=>{
 const c=caveAt(x,z);if(c)return caveFloor(c,z);
 // Blend the approach into the portal, avoiding an artificial rectangular terrace.
 let h=surfaceHeight(x,z);for(const c of caves){const d=Math.hypot((x-c.x)*1.5,Math.max(0,z-c.z));if(z>=c.z&&d<14){const t=1-d/14;h=h*(1-t)+caveFloor(c,z)*t}}return h;
};
export const ropeCrossing={x:135,z:-175,from:{x:121,z:-175},to:{x:149,z:-175}};
export function trailDistance(x:number,z:number){return Math.min(...trails.flatMap(t=>t.points.slice(1).map((p,i)=>{const a=t.points[i],dx=p[0]-a[0],dz=p[1]-a[1],f=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-f*dx,z-a[1]-f*dz)})))}
const originalDestinations = [
  {id:'cume',name:'Cume das Araucárias',x:94,z:-91,description:'Suba pela trilha em zigue-zague até o mirante mais alto.'},
  {id:'pedras',name:'Serra das Pedras',x:-99,z:-86,description:'Uma travessia entre rochedos e pequenas clareiras.'},
  {id:'rio',name:'Vale do Riacho',x:-83,z:65,description:'Siga a água, encontre a ponte e descanse à sombra.'},
  {id:'flores',name:'Prado das Flores',x:89,z:89,description:'Um caminho entre flores silvestres e pequenas colinas.'},
  {id:'refugio',name:'Abrigo dos Pioneiros',x:-111,z:112,description:'Um abrigo de madeira para o fim de uma caminhada longa.'},
  {id:'cachoeira',name:'Cascata da Serra',x:-125,z:-58,description:'Água correndo entre as pedras, perto da trilha da serra.'},
];
const originalDiscoveries = [
  {id:'primeira-fogueira',name:'Chama da Amizade',x:4,z:12,rarity:'Comum',hint:'Um brilho dourado perto da roda da fogueira.',story:'Toda aventura começa com alguém para dividir a história.'},
  {id:'folha-campo',name:'Folha de Campo',x:-26,z:-12,rarity:'Comum',hint:'Procure entre as primeiras barracas.',story:'Uma lembrança do bosque que protege o acampamento.'},
  {id:'rosa-ventos',name:'Rosa dos Ventos',x:30,z:-24,rarity:'Incomum',hint:'As amarras da oficina apontam um caminho.',story:'Orientação, preparo e vontade de descobrir.'},
  {id:'gota-lago',name:'Gota do Lago',x:-19,z:16,rarity:'Comum',hint:'Perto das tábuas do píer.',story:'Um momento de calma entre duas caminhadas.'},
  {id:'estrela-sul',name:'Constelação do Sul',x:28,z:21,rarity:'Incomum',hint:'Os olhos do telescópio miram o céu.',story:'As estrelas também ajudam a encontrar o caminho.'},
  {id:'semente-trilha',name:'Semente da Trilha',x:45,z:-38,rarity:'Comum',hint:'O começo da subida do Cume guarda uma semente.',story:'Grandes jornadas nascem de pequenos passos.'},
  {id:'cume-dourado',name:'Cume Dourado',x:94,z:-91,rarity:'Raro',hint:'A recompensa de quem alcança o mirante mais alto.',story:'A vista faz cada curva da subida valer a pena.'},
  {id:'cristal-serra',name:'Cristal da Serra',x:-99,z:-86,rarity:'Raro',hint:'Uma pedra especial no alto da serra.',story:'Paciência e observação revelam o que passaria despercebido.'},
  {id:'ponte-amizade',name:'Laço da Ponte',x:-83,z:65,rarity:'Incomum',hint:'Encontre a ponte no vale do riacho.',story:'Uma ponte aproxima caminhos e pessoas.'},
  {id:'flor-prado',name:'Flor do Prado',x:89,z:89,rarity:'Incomum',hint:'A trilha das flores termina numa clareira.',story:'Explore sem deixar de cuidar do lugar.'},
  {id:'insignia-pioneiro',name:'Insígnia do Pioneiro',x:-111,z:112,rarity:'Raro',hint:'O abrigo mais distante guarda uma lembrança.',story:'Estar preparado também é saber acolher quem chega.'},
  {id:'nevoa-cascata',name:'Névoa da Cascata',x:-125,z:-58,rarity:'Raro',hint:'Siga o som da água pela trilha da cascata.',story:'Alguns tesouros são os lugares que conhecemos.'},
];
// Shared coordinates drive geometry, the atlas, discoveries and signs.
const landmarkPositions:Record<string,[number,number]>={cume:[245,-230],pedras:[-245,-255],rio:[-170,120],flores:[210,205],refugio:[-210,270],cachoeira:[-220,-130]};
const rewardPositions:Record<string,[number,number]>={'semente-trilha':[64,-60],'cume-dourado':landmarkPositions.cume,'cristal-serra':landmarkPositions.pedras,'ponte-amizade':landmarkPositions.rio,'flor-prado':landmarkPositions.flores,'insignia-pioneiro':landmarkPositions.refugio,'nevoa-cascata':landmarkPositions.cachoeira};
const scale=(x:number,z:number):[number,number]=>[x,z];
export const destinations = [
 ...originalDestinations.map(p=>{const [x,z]=landmarkPositions[p.id];return {...p,x,z}}),
 ...caves.map(c=>({...c,description:'Entre pela abertura da encosta. A câmera se aproxima; leve uma fonte de luz.'})),
 {id:'mata-fechada',name:'Mata Fechada',x:195,z:-90,description:'Um corredor de araucárias liga o vale à encosta leste.'},
 {id:'travessia-corda',name:'Travessia da Ravina',x:121,z:-175,description:'Fixe a corda entre as duas margens para cruzar.'},
];
export const campPaths=[
 {name:'Alameda da fogueira',width:4.5,points:[[-38,0],[-15,0],[-9,7],[0,10],[9,7],[15,0],[38,0]]},
 {name:'Caminho dos pioneiros',width:3.5,points:[[0,38],[0,14],[10,2],[14,-9],[23,-13],[38,-18]]},
 {name:'Alameda das barracas',width:3,points:[[-38,-18],[-28,-13],[-14,-9],[-8,-15],[0,-23],[0,-26]]},
 {name:'Caminho do lago',width:3,points:[[-19,15],[-12,12],[0,14],[14,16],[25,12],[38,18]]},
];
export const trails = [
 ...campPaths,
 {name:'Circuito do Vale',width:4.2,points:[[0,38],[70,65],[160,150],[210,205],[130,280],[-20,300],[-160,245],[-210,140],[-240,0],[-220,-130],[-145,-200],[0,-240],[110,-210],[200,-145],[270,-35],[250,100],[160,150]]},
 {name:'Portão da Serra',width:3.5,points:[[-38,-18],[-90,-55],[-160,-85],[-220,-130]]},
 {name:'Trilha das Araucárias',width:3,points:[[38,-18],[64,-60],[110,-90],[155,-65],[195,-90],[200,-145]]},
 {name:'Trilha do Riacho',width:3,points:[[-38,0],[-85,40],[-125,95],[-170,120],[-210,140]]},
 {name:'Trilha do Prado',width:3,points:[[38,18],[85,50],[110,100],[160,150]]},
 {name:'Subida do Cume',width:2.5,points:[[200,-145],[250,-158],[215,-183],[275,-197],[235,-216],[245,-230]]},
 {name:'Serra das Pedras',width:2.5,points:[[-145,-200],[-195,-185],[-180,-222],[-245,-213],[-220,-244],[-245,-255]]},
 {name:'Caminho dos Cristais',width:2.4,points:[[160,150],[205,175],[235,180],[250,175],[250,155]]},
 {name:'Trilha do Eco',width:2.4,points:[[-220,-130],[-245,-115],[-270,-130],[-270,-155]]},
 {name:'Caminho do Abrigo',width:3,points:[[-160,245],[-190,240],[-210,270]]},
 {name:'Passagem da Ravina',width:2,points:[[110,-90],[100,-135],[121,-175],[149,-175],[175,-190],[200,-145]]},
 {name:'Retorno das Águas',width:2.4,points:[[-170,120],[-130,180],[-65,190],[0,145],[0,38]]},
];
export const discoveries = [
 ...originalDiscoveries.map(r=>{const [x,z]=rewardPositions[r.id]??scale(r.x,r.z);return {...r,x,z}}),
 ...caves.map(c=>({id:c.id+'-cristal',name:c.id==='gruta-cristais'?'Cristal da Profundeza':'Emblema do Eco',x:c.x,z:c.z-c.length+4,rarity:'Raro',hint:'No fundo de uma caverna. Leve uma fonte de luz.',story:'A luz revelou um novo caminho.'})),
 {id:'segredo-mata',name:'Guardião da Mata',x:195,z:-90,rarity:'Raro',hint:'Siga a trilha estreita até o coração da mata fechada.',story:'Um caminho escondido entre as árvores.'},
 {id:'ancoragem',name:'Nó de Confiança',x:157,z:-175,rarity:'Incomum',hint:'Atravesse a ravina com uma corda.',story:'Preparo e boas amarras abriram a passagem.'},
];
export type Discovery = typeof discoveries[number];

/** One watercourse links the cascade, creek bridge and lower valley. */
export const riverPoints:[number,number][]=[[-220,-130],[-245,-85],[-220,-20],[-205,45],[-170,120],[-145,180],[-75,225],[5,245],[110,285],[220,340],[330,400]];

