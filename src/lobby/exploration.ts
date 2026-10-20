export const AREA_MULTIPLIER = 15;
export const SIZE = 100 * Math.sqrt(AREA_MULTIPLIER);
export const BOUNDARY = 38 * Math.sqrt(AREA_MULTIPLIER);
export const mapPercent = (metres: number, span = SIZE) => metres / span * 100 + 50;
const codes: Record<string,string> = {fogueira:'F',acampamento:'B',oficina:'O',lago:'L',observatorio:'M',vip:'V',cume:'C',pedras:'S',rio:'R',flores:'P',refugio:'A',cachoeira:'Q'};
export const mapCode = (id:string) => codes[id] ?? '?';
export const terrainHeight = (x: number, z: number) => {
  const edge = Math.min(1, Math.max(0, (Math.hypot(x,z)-43)/28));
  const fade = edge*edge*(3-2*edge);
  const hill = (cx:number,cz:number,h:number,r:number) => h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
  return fade*(hill(94,-91,46,36)+hill(-99,-86,33,42)+hill(93,97,28,38)+hill(-117,112,17,35)+1.3*(Math.sin(x*.055)+Math.cos(z*.06)));
};
export const destinations = [
  {id:'cume',name:'Cume das Araucárias',x:94,z:-91,description:'Suba pela trilha em zigue-zague até o mirante mais alto.'},
  {id:'pedras',name:'Serra das Pedras',x:-99,z:-86,description:'Uma travessia entre rochedos e pequenas clareiras.'},
  {id:'rio',name:'Vale do Riacho',x:-83,z:65,description:'Siga a água, encontre a ponte e descanse à sombra.'},
  {id:'flores',name:'Prado das Flores',x:89,z:89,description:'Um caminho entre flores silvestres e pequenas colinas.'},
  {id:'refugio',name:'Abrigo dos Pioneiros',x:-111,z:112,description:'Um abrigo de madeira para o fim de uma caminhada longa.'},
  {id:'cachoeira',name:'Cascata da Serra',x:-125,z:-58,description:'Água correndo entre as pedras, perto da trilha da serra.'},
];
export const trails = [
  {name:'Trilha do Cume',points:[[23,-18],[44,-39],[80,-44],[60,-65],[108,-66],[80,-86],[94,-91]]},
  {name:'Travessia das Pedras',points:[[-23,-18],[-44,-40],[-76,-34],[-59,-62],[-104,-58],[-82,-83],[-99,-86]]},
  {name:'Caminho das Águas',points:[[-24,18],[-44,36],[-70,31],[-83,65],[-106,78],[-111,112]]},
  {name:'Circuito do Prado',points:[[25,18],[51,35],[48,63],[80,58],[66,83],[89,89],[104,112]]},
  {name:'Trilha da Cascata',points:[[-76,-34],[-98,-26],[-128,-38],[-125,-58]]},
];
export const discoveries = [
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
export type Discovery = typeof discoveries[number];
