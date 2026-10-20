export const PREVIOUS_AREA_MULTIPLIER = 15;
export const EXPANSION = Math.sqrt(10);
export const AREA_MULTIPLIER = PREVIOUS_AREA_MULTIPLIER * 10;
export const SIZE = 100 * Math.sqrt(AREA_MULTIPLIER);
export const BOUNDARY = 38 * Math.sqrt(AREA_MULTIPLIER);
export const mapPercent = (metres: number, span = SIZE) => metres / span * 100 + 50;
const codes: Record<string,string> = {fogueira:'F',acampamento:'B',oficina:'O',lago:'L',observatorio:'M',vip:'V',cume:'C',pedras:'S',rio:'R',flores:'P',refugio:'A',cachoeira:'Q'};
export const mapCode = (id:string) => codes[id] ?? '?';
const rawTerrain = (x: number, z: number) => {
  const edge = Math.min(1, Math.max(0, (Math.hypot(x,z)-43)/45));
  const fade = edge*edge*(3-2*edge), u=x/EXPANSION, v=z/EXPANSION;
  const hill = (cx:number,cz:number,h:number,r:number) => h*Math.exp(-((u-cx)**2+(v-cz)**2)/(r*r));
  return fade*(hill(94,-91,70,36)+hill(-99,-86,53,42)+hill(93,97,44,38)+hill(-117,112,28,35)+2*(Math.sin(u*.055)+Math.cos(v*.06)));
};
export const caves = [
  {id:'gruta-cristais',name:'Gruta dos Cristais',x:342,z:170,length:72},
  {id:'caverna-eco',name:'Caverna do Eco',x:-350,z:-210,length:60},
];
export function caveAt(x:number,z:number){return caves.find(c=>{
  const u=x-c.x,v=z-c.z;
  return (Math.abs(u)<4.5&&v<0&&v>-c.length)||(Math.abs(u)<9&&v<-c.length+14&&v>-c.length-6)||(u>-2&&u<31&&v<-38&&v>-48);
})}
export const terrainHeight = (x:number,z:number) => {
  let h=rawTerrain(x,z);
  for(const c of caves){const dx=Math.max(0,Math.abs(x-c.x-10)-23),dz=Math.max(0,Math.abs(z-c.z+(c.length-4)/2)-(c.length+12)/2);const distance=Math.hypot(dx,dz);if(distance<12){const weight=1-distance/12;h=h*(1-weight)+rawTerrain(c.x,c.z)*weight}}
  return h;
};
export const ropeCrossing={x:180,z:-240,from:{x:166,z:-240},to:{x:194,z:-240}};
export function trailDistance(x:number,z:number){return Math.min(...trails.flatMap(t=>t.points.slice(1).map((p,i)=>{const a=t.points[i],dx=p[0]-a[0],dz=p[1]-a[1],f=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-f*dx,z-a[1]-f*dz)})))}
const originalDestinations = [
  {id:'cume',name:'Cume das Araucárias',x:94,z:-91,description:'Suba pela trilha em zigue-zague até o mirante mais alto.'},
  {id:'pedras',name:'Serra das Pedras',x:-99,z:-86,description:'Uma travessia entre rochedos e pequenas clareiras.'},
  {id:'rio',name:'Vale do Riacho',x:-83,z:65,description:'Siga a água, encontre a ponte e descanse à sombra.'},
  {id:'flores',name:'Prado das Flores',x:89,z:89,description:'Um caminho entre flores silvestres e pequenas colinas.'},
  {id:'refugio',name:'Abrigo dos Pioneiros',x:-111,z:112,description:'Um abrigo de madeira para o fim de uma caminhada longa.'},
  {id:'cachoeira',name:'Cascata da Serra',x:-125,z:-58,description:'Água correndo entre as pedras, perto da trilha da serra.'},
];
const originalTrails = [
  {name:'Trilha do Cume',points:[[23,-18],[44,-39],[80,-44],[60,-65],[108,-66],[80,-86],[94,-91]]},
  {name:'Travessia das Pedras',points:[[-23,-18],[-44,-40],[-76,-34],[-59,-62],[-104,-58],[-82,-83],[-99,-86]]},
  {name:'Caminho das Águas',points:[[-24,18],[-44,36],[-70,31],[-83,65],[-106,78],[-111,112]]},
  {name:'Circuito do Prado',points:[[25,18],[51,35],[48,63],[80,58],[66,83],[89,89],[104,112]]},
  {name:'Trilha da Cascata',points:[[-76,-34],[-98,-26],[-128,-38],[-125,-58]]},
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
const scale=(x:number,z:number):[number,number]=>Math.hypot(x,z)<=43?[x,z]:[x*EXPANSION,z*EXPANSION];
export const destinations = [
 ...originalDestinations.map(p=>{const [x,z]=scale(p.x,p.z);return {...p,x,z}}),
 ...caves.map(c=>({...c,description:'Entre a pé, acenda a lanterna e explore as galerias e a câmara dos cristais.'})),
 {id:'mata-fechada',name:'Mata Fechada',x:240,z:-180,description:'Um corredor estreito entre árvores e vegetação densa.'},
 {id:'travessia-corda',name:'Travessia da Ravina',x:166,z:-240,description:'Use a corda nos pontos de ancoragem para atravessar.'},
];
export const trails = [
 ...originalTrails.map(t=>({...t,width:3.5,points:t.points.map(([x,z])=>scale(x,z))})),
 {name:'Trilha da Mata Fechada',width:1.8,points:[[23,-18],[80,-55],[135,-100],[110,-140],[180,-165],[205,-120],[240,-180],[290,-145],[342,170]]},
 {name:'Caminho dos Cristais',width:2.2,points:[[25,18],[79,57],[160,110],[210,80],[270,135],[310,115],[342,170]]},
 {name:'Trilha do Eco',width:1.8,points:[[-23,-18],[-75,-55],[-140,-110],[-200,-80],[-270,-160],[-320,-145],[-350,-210]]},
 {name:'Passagem da Ravina',width:2,points:[[135,-100],[145,-190],[166,-240],[194,-240],[240,-260],[297,-288]]},
];
export const discoveries = [
 ...originalDiscoveries.map(r=>{const [x,z]=scale(r.x,r.z);return {...r,x,z}}),
 ...caves.map(c=>({id:c.id+'-cristal',name:c.id==='gruta-cristais'?'Cristal da Profundeza':'Emblema do Eco',x:c.x,z:c.z-c.length+4,rarity:'Raro',hint:'No fundo de uma caverna. Leve uma fonte de luz.',story:'A luz revelou um novo caminho.'})),
 {id:'segredo-mata',name:'Guardião da Mata',x:240,z:-180,rarity:'Raro',hint:'Siga a trilha estreita até o coração da mata fechada.',story:'Um caminho escondido entre as árvores.'},
 {id:'ancoragem',name:'Nó de Confiança',x:202,z:-240,rarity:'Incomum',hint:'Atravesse a ravina com uma corda.',story:'Preparo e boas amarras abriram a passagem.'},
];
export type Discovery = typeof discoveries[number];
