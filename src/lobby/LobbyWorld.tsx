import { useEffect, useRef, useState, type PointerEvent } from "react";
import * as T from "three";
import {
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Binoculars,
  Map as MapIcon,
  Hand,
  LocateFixed,
} from "lucide-react";
import { person, label, disposeScene } from "../world/character";
import {createMotion,advanceMotion,obstacleIndex,dampAngle} from './motion';
import {configureRenderer,type GraphicQuality} from './rendering';
import { avatars } from "./profiles";
import { buildLobby, places, SIZE } from "./scene";
import type { Profile, Visitor } from "./useLobby";
import {BOUNDARY, terrainHeight, caveAt, ropeCrossing, discoveries, type Discovery} from './exploration';
import {movementSpeed,energyStep,gearIds} from './gear';
import FieldMap from './FieldMap';
import Quickbelt from './Quickbelt';
import {createEquipment,type Equipment} from './equipment';
import {startWaterAction,advanceWaterAction,type WaterAction} from './itemActions';
import {coverAt,cameraBoom,coveredFraming} from './coveredCamera';
import {frameProfiler} from './diagnostics';
type Props = {
  profile: Profile;
  players: Visitor[];
  item: string;
  onEquip: (id:string)=>void;
  gesture: string;
  paused: boolean;
  vip: boolean;
  onMove: (x: number, y: number, visualItem?:string) => void;
  onPlayer: (p: Visitor) => void;
  onVip: () => void;
  initialPosition?: {x:number;z:number};
  foundIds: string[];
  onDiscover: (reward: Discovery) => void;
};
export default function LobbyWorld(props: Props) {
  const section = useRef<HTMLElement>(null),
    host = useRef<HTMLDivElement>(null),
    surface = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const view = useRef({ yaw: Math.PI/4, pitch: Math.atan(1/Math.sqrt(2)), distance: 30 }),
    input = useRef({ x: 0, z: 0, run: false, jump:false });
  const [quality,setQuality]=useState<GraphicQuality>(()=>{try{const saved=localStorage.getItem("trilha.graphics");return saved==="high"||saved==="economy"?saved:"auto"}catch{return "auto"}});
  const qualityRef=useRef(quality);qualityRef.current=quality;
  const [overview,setOverview]=useState(false);
  const overviewRef=useRef(false);overviewRef.current=overview;
  const waypoint=useRef<{x:number;z:number;name:string}|null>(null);
  const [showPerformance,setShowPerformance]=useState(false),[performanceText,setPerformanceText]=useState("Amostrando…");
  const showPerformanceRef=useRef(false);showPerformanceRef.current=showPerformance;
  const [joystick,setJoystick]=useState<{x:number;y:number}|null>(null),stick=useRef<HTMLDivElement>(null);
  const touches = useRef(
    new Map<number, { x: number; y: number; kind: "walk" | "camera" }>(),
  );
  const [fullscreen, setFullscreen] = useState(false),
    [expanded, setExpanded] = useState(false),
    [error, setError] = useState(""),
    [near, setNear] = useState(places[0]),
    [run, setRun] = useState(false),
    [help, setHelp] = useState(false),
    [mapExpanded, setMapExpanded] = useState(false);
  const resources=useRef({energy:100,water:3,light:true,observing:false,mounted:true,message:'',messageUntil:0,action:null as WaterAction|null,crossing:null as null|{from:{x:number;y:number};to:{x:number;y:number};elapsed:number}});
  const useItem=useRef<(mode?:'refill')=>void>(()=>{});
  const [hud,setHud]=useState({energy:100,water:3,cave:'',heading:0,light:true,observing:false,mounted:true,message:'',bearing:'',distance:0,action:'',progress:0,canRefill:false});
  const [nearReward,setNearReward] = useState<Discovery|null>(null);
  const [coords, setCoords] = useState({ x: 0, z: 7 });
  const petUntil = useRef(0);
  latest.current = { ...props,onEquip:equip, paused: props.paused || help || mapExpanded };
  function equip(id:string){if(resources.current.crossing){resources.current.message='Conclua a travessia antes de trocar o item.';resources.current.messageUntil=performance.now()+4000;return}props.onEquip(id)}
  useEffect(() => {
    const change = () =>
      setFullscreen(document.fullscreenElement === section.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (section.current?.requestFullscreen)
        await section.current.requestFullscreen();
      else setExpanded((v) => !v);
    } catch {
      setExpanded((v) => !v);
    }
  }
  async function openPanel(callback: () => void) {
    setExpanded(false);
    if (document.fullscreenElement) await document.exitFullscreen();
    callback();
  }
  useEffect(() => {
    if (!host.current) return;
    const container = host.current,
      scene = new T.Scene();
    scene.background = new T.Color("#c2d4c6");
    scene.fog = new T.Fog("#d4dbcc", 120, 550);
    const ambient=new T.HemisphereLight("#d9e8ec", "#687853", 1.65); scene.add(ambient);
    const sun = new T.DirectionalLight("#ffe4b2", 2.6);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=sun.shadow.camera.bottom=-32;sun.shadow.camera.right=sun.shadow.camera.top=32;sun.shadow.camera.near=1;sun.shadow.camera.far=140;sun.shadow.normalBias=.04;sun.shadow.bias=-.00012;sun.shadow.radius=2;scene.add(sun.target);
    sun.position.set(-25, 45, 20);
    scene.add(sun);
    const world = buildLobby(scene, props.vip);
    const environmentLabels:T.Sprite[]=[];scene.traverse(n=>{if(n instanceof T.Sprite)environmentLabels.push(n)});
    const treasureMeshes = discoveries.map(reward => {
      const root=new T.Group();root.position.set(reward.x,terrainHeight(reward.x,reward.z)+1.1,reward.z);
      const gem=new T.Mesh(new T.OctahedronGeometry(.45),new T.MeshStandardMaterial({color:reward.rarity==='Raro'?'#87b9b1':'#e9bd61',emissive:'#8a5d23',emissiveIntensity:.2,metalness:.3,roughness:.4}));root.add(gem);
      const ring=new T.Mesh(new T.TorusGeometry(.7,.025,5,24),new T.MeshStandardMaterial({color:'#e6c777'}));ring.rotation.x=Math.PI/2;ring.position.y=-.6;root.add(ring);
      const tag=label(reward.name);tag.position.y=1;tag.scale.set(3,.5,1);root.add(tag);scene.add(root);return {reward,root,gem,tag};
    });
    const actor = person(
      Math.max(
        0,
        avatars.findIndex((a) => a.id === props.profile.avatar),
      ),
    );
    scene.add(actor.root);
    const name = label(props.profile.nickname || "Você");
    name.position.y = 2.6;
    actor.root.add(name);
    const actors = new Map<
      string,
      {
        actor: ReturnType<typeof person>;
        item: Equipment;
        itemId: string;
        tag: T.Sprite;
        lastX: number;
        lastY: number;
        signature: string;
      }
    >();
    let itemId=latest.current.item,equipped=createEquipment(actor,scene,itemId);
    const tell=(text:string)=>{resources.current.message=text;resources.current.messageUntil=performance.now()+4500};
    const syncEquipment=()=>{if(resources.current.crossing||itemId===latest.current.item)return;equipped.dispose();itemId=latest.current.item;resources.current.observing=false;resources.current.action=null;resources.current.mounted=itemId==='bicicleta';equipped=createEquipment(actor,scene,itemId)};
    const ropeVisual=new T.Group();ropeVisual.userData.dynamic=true;scene.add(ropeVisual);
    const showRope=()=>{
      disposeScene(ropeVisual);ropeVisual.clear();
      const a=ropeCrossing.from,b=ropeCrossing.to,pa=new T.Vector3(a.x,terrainHeight(a.x,a.z)+1.5,a.z+1.7),pb=new T.Vector3(b.x,terrainHeight(b.x,b.z)+1.5,b.z+1.7),mid=pa.clone().lerp(pb,.5);mid.y-=.4;
      const cable=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([pa,mid,pb]),32,.045,6,false),new T.MeshStandardMaterial({color:'#d4b77d',roughness:1}));ropeVisual.add(cable);
    };

    let p = {
        x: props.initialPosition?.x ?? Math.random() * 4 - 2,
        y: props.initialPosition?.z ?? (props.vip ? -31 : 7 + Math.random() * 2),
      },
      frame = 0,
      last = performance.now(),
      published = 0;
    const groundHeight=(x:number,z:number)=>terrainHeight(x,z)+(Math.hypot(x,z)<43?.17:0);
    const motion=createMotion(p.x,p.y,groundHeight),queryObstacles=obstacleIndex(world.obstacles);
    const lookTarget=new T.Vector3(p.x,groundHeight(p.x,p.y)+1,p.y),desiredLook=new T.Vector3(),peerTarget=new T.Vector3();
    const daylight=new T.Color('#d4dbcc'),night=new T.Color('#1e2824');
    let coverBlend=0,coverBoom=3.5,caveBlend=0,cameraDistance=view.current.distance,cameraYaw=view.current.yaw,autoScale=1,lastTuning=0,appliedQuality=qualityRef.current;
    useItem.current=(mode)=>{
      syncEquipment();
      const r=resources.current,item=itemId;
      if(latest.current.paused)return;
      if(r.crossing){tell('Conclua a travessia antes de usar outro item.');return}
      if(r.action){tell('Espere concluir a ação do cantil.');return}
      if(item==='mapa'){setMapExpanded(true);return}
      if(item==='bussola'){view.current.yaw=0;tell('Câmera orientada ao norte. A agulha vermelha indica o norte.');return}
      if(item==='botas'){tell('Botas calçadas: melhor aderência e velocidade nas subidas.');return}
      if(item==='pet'){petUntil.current=performance.now()+5000;tell('Seu companheiro está farejando os arredores.');return}
      if(item==='lanterna'||item==='capacete'){r.light=!r.light;tell(r.light?'Luz ligada':'Luz desligada')}
      else if(item==='bicicleta'){if(caveAt(p.x,p.y)){tell('A bicicleta fica do lado de fora. Explore a caverna a pé.');return}if(!r.mounted&&equipped.parkedDistance(p.x,p.y)>3){tell(`Aproxime-se da bicicleta estacionada (${Math.round(equipped.parkedDistance(p.x,p.y))} m).`);return}r.mounted=!r.mounted;tell(r.mounted?'Bicicleta montada: pedale com WASD ou analógico':'Você desceu da bicicleta')}
      else if(item==='binoculos')r.observing=!r.observing;
      else if(item==='cantil'){
        const waters=[{x:-24,z:18},...places.filter(v=>['rio','cachoeira'].includes(v.id))];
        const nearWater=waters.some(v=>Math.hypot(v.x-p.x,v.z-p.y)<12);
        if(mode==='refill'&&!nearWater){tell('Aproxime-se do lago ou do riacho para reabastecer.');return}
        tell(startWaterAction(r,mode==='refill'));
      }else if(item==='corda'){
        const from=ropeCrossing.from,to=ropeCrossing.to;
        const a=Math.hypot(p.x-from.x,p.y-from.z),b=Math.hypot(p.x-to.x,p.y-to.z);
        if(Math.min(a,b)<7&&!r.crossing){const dest=a<b?to:from;r.crossing={from:{...p},to:{x:dest.x,y:dest.z},elapsed:0};showRope();tell('Corda fixada: atravessando a ravina')}
        else tell('Leve a corda a um ponto de ancoragem da ravina');
      }
    };
    const isoCamera=new T.OrthographicCamera(-30,30,30,-30,.1,2400),eyeCamera=new T.PerspectiveCamera(22,1,.05,650),coveredView=new T.PerspectiveCamera(65,1,.05,180);
    let camera:T.OrthographicCamera|T.PerspectiveCamera=isoCamera;
    const
      keys = new Set<string>();
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
      configureRenderer(renderer,qualityRef.current);renderer.localClippingEnabled=true;
      renderer.domElement.setAttribute(
        "aria-label",
        "Expedição 3D isométrica com vale, serras, cavernas e jogadores conectados",
      );
      container.appendChild(renderer.domElement);
    } catch {
      setError(
        "Não foi possível abrir o 3D. Ative a aceleração gráfica ou use outro navegador.",
      );
      disposeScene(scene);
      return;
    }
    const profileFrame=frameProfiler(renderer,container);
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      if(!w||!h)return;
      eyeCamera.aspect=w/h;eyeCamera.updateProjectionMatrix();coveredView.aspect=w/h;coveredView.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const reset = () => {
      keys.clear();
      input.current.x = input.current.z = 0;input.current.jump=false;
      touches.current.clear();setJoystick(null);
    };
    const down = (e: KeyboardEvent) => {
      if(e.code==='KeyM'&&surface.current?.contains(document.activeElement)){e.preventDefault();setMapExpanded(v=>!v);return}
      if(e.code==='Escape'){setMapExpanded(false);resources.current.observing=false;return}
      if (
        latest.current.paused ||
        !surface.current?.contains(document.activeElement) ||
        (e.target as HTMLElement).closest("input,button,textarea,select")
      )
        return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "ShiftLeft",
        ].includes(e.code)
      ) {
        e.preventDefault();
        keys.add(e.code);
      }
      if(/^Digit[0-9]$/.test(e.code)&&!e.repeat){const n=Number(e.code.slice(-1));latest.current.onEquip(gearIds[(n+9)%10]);e.preventDefault()}
      if(e.code==='KeyQ'&&!e.repeat)view.current.yaw-=Math.PI/2;
      if(e.code==='KeyR'&&!e.repeat)view.current.yaw+=Math.PI/2;
      if(e.code==='Space'&&!e.repeat){e.preventDefault();input.current.jump=true}
      if(e.code==='KeyG'&&!e.repeat&&latest.current.item==='cantil'){e.preventDefault();useItem.current('refill')}
      if(e.code==='KeyF'&&!e.repeat){e.preventDefault();useItem.current()}
      if(e.code==='KeyE'&&!e.repeat){if(caveAt(p.x,p.y)&&!(['lanterna','capacete'].includes(latest.current.item)&&resources.current.light))return;const reward=discoveries.find(r=>!latest.current.foundIds.includes(r.id)&&Math.hypot(r.x-p.x,r.z-p.y)<3.5);if(reward)latest.current.onDiscover(reward)}
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    const tick = (now: number) => {
      const dt = Math.max(0,Math.min(0.1, (now - last) / 1000));
      last = now;
      if (latest.current.paused || document.hidden) reset();
      const enabled = !latest.current.paused && !document.hidden;
      const dx = enabled
        ? Number(keys.has("KeyD") || keys.has("ArrowRight")) -
          Number(keys.has("KeyA") || keys.has("ArrowLeft")) +
          input.current.x
        : 0;
      const dz = enabled
        ? Number(keys.has("KeyS") || keys.has("ArrowDown")) -
          Number(keys.has("KeyW") || keys.has("ArrowUp")) +
          input.current.z
        : 0;
      const covered=coverAt(p.x,p.y,queryObstacles(p.x,p.y,5));
      const closeInspection=(view.current.distance<12||!!covered)&&!overviewRef.current;
      for(const tag of environmentLabels)tag.visible=!closeInspection;
      const { yaw, pitch, distance } = view.current,
        wx = dx * Math.cos(yaw) + dz * Math.sin(yaw),
        wz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
      syncEquipment();
      const r=resources.current,cave=caveAt(p.x,p.y),bike=itemId==='bicicleta'&&r.mounted&&!cave;
      if(cave&&itemId==='bicicleta'&&r.mounted){r.mounted=false;tell('Você desceu da bicicleta para entrar na caverna.')}
      if((dx||dz)&&r.action){r.action=null;tell('Ação do cantil interrompida pela caminhada.')}
      const waterMessage=advanceWaterAction(r,dt,itemId,enabled);if(waterMessage)tell(waterMessage);
      const slope=Math.abs(terrainHeight(p.x+Math.sin(actor.root.rotation.y)*2,p.y+Math.cos(actor.root.rotation.y)*2)-terrainHeight(p.x,p.y))/2;
      const sprint=input.current.run||keys.has('ShiftLeft');
      const speed=movementSpeed(bike?'bicicleta':latest.current.item==='bicicleta'?'':latest.current.item,sprint,r.energy,slope,!!cave);
      advanceMotion(motion,{x:wx,z:wz,speed,jump:input.current.jump,enabled,bike},dt,groundHeight,queryObstacles,BOUNDARY);input.current.jump=false;
      if(r.crossing){
        if(enabled)r.crossing.elapsed+=dt;
        const t=Math.min(1,r.crossing.elapsed/2.4),smooth=t*t*(3-2*t);
        motion.x=r.crossing.from.x+(r.crossing.to.x-r.crossing.from.x)*smooth;motion.z=r.crossing.from.y+(r.crossing.to.y-r.crossing.from.y)*smooth;
        motion.y=groundHeight(motion.x,motion.z)+Math.sin(t*Math.PI)*.35;motion.vx=motion.vz=0;
        if(t>=1)r.crossing=null;
      }
      const moved=Math.hypot(motion.x-p.x,motion.z-p.y),moving=moved>.0005,actualSpeed=moved/Math.max(dt,.001);
      if(moving)actor.root.rotation.y=dampAngle(actor.root.rotation.y,Math.atan2(motion.x-p.x,motion.z-p.y),bike?9:18,dt);
      p.x=motion.x;p.y=motion.z;
      const altitude=groundHeight(p.x,p.y),air=Math.max(0,motion.y-altitude);
      actor.root.position.set(p.x,motion.y,p.y);
      actor.animate(now/1000,moving,latest.current.gesture,bike,{speed:actualSpeed,air,landing:motion.landing,item:itemId,action:r.action?.kind==='drink'?Math.sin(Math.PI*r.action.elapsed/r.action.duration):0,observing:r.observing,cyclePhase:equipped.phase,crossing:!!r.crossing});
      if(enabled)r.energy=energyStep(r.energy,moving,sprint,bike,dt);
      const inside=caveAt(p.x,p.y),hasLight=['lanterna','capacete'].includes(latest.current.item)&&r.light;
      caveBlend+=(Number(!!inside)-caveBlend)*(1-Math.exp(-4*dt));
      ambient.intensity=T.MathUtils.lerp(1.65,.48,caveBlend);sun.intensity=T.MathUtils.lerp(2.6,.05,caveBlend);
      const fog=scene.fog as T.Fog;fog.color.copy(daylight).lerp(night,caveBlend);fog.near=resources.current.observing?180:380;fog.far=resources.current.observing?650:T.MathUtils.lerp(1100,650,caveBlend);
      (scene.background as T.Color).copy(fog.color);
      const shadowX=Math.round(p.x*16)/16,shadowZ=Math.round(p.y*16)/16;sun.position.set(shadowX-28,altitude+48,shadowZ+22);sun.target.position.set(shadowX,altitude,shadowZ);
      const petGoal=discoveries.reduce<Discovery|undefined>((best,g)=>latest.current.foundIds.includes(g.id)?best:!best||Math.hypot(g.x-p.x,g.z-p.y)<Math.hypot(best.x-p.x,best.z-p.y)?g:best,undefined);
      equipped.update({time:now/1000,dt:enabled?dt:0,x:p.x,y:motion.y,z:p.y,heading:actor.root.rotation.y,speed:actualSpeed,distance:moved,mounted:bike,light:hasLight,observing:r.observing,action:r.action?.kind==='drink'?Math.sin(Math.PI*r.action.elapsed/r.action.duration):0,playing:petUntil.current>now,goal:petGoal&&Math.hypot(petGoal.x-p.x,petGoal.z-p.y)<25?petGoal:undefined,height:groundHeight,obstacles:queryObstacles});
      const ids = new Set(latest.current.players.map((v) => v.id));
      for (const [id, a] of actors)
        if (!ids.has(id)) {
          scene.remove(a.actor.root);
          a.item.dispose();disposeScene(a.actor.root);
          actors.delete(id);
        }
      for (const peer of latest.current.players) {
        let a = actors.get(peer.id);
        const signature = `${peer.nickname}:${peer.avatar}`;
        if (a && a.signature !== signature) {
          scene.remove(a.actor.root); a.item.dispose();disposeScene(a.actor.root); actors.delete(peer.id); a = undefined;
        }
        if (!a) {
          const other = person(
            Math.max(
              0,
              avatars.findIndex((v) => v.id === peer.avatar),
            ),
          );
          const tag = label(peer.nickname);
          tag.position.y = 2.6;
          other.root.add(tag);
          const item = createEquipment(other,scene,peer.item);
          other.root.position.set(
            ((peer.x - 50) * SIZE) / 100,
            0,
            ((peer.y - 50) * SIZE) / 100,
          );
          scene.add(other.root);
          a = {
            actor: other,
            item,
            itemId: peer.item,
            tag,
            lastX: peer.x,
            lastY: peer.y,
            signature,
          };
          actors.set(peer.id, a);
        }
        const dest=peerTarget.set(((peer.x-50)*SIZE)/100,0,((peer.y-50)*SIZE)/100);
        const deltaX=dest.x-a.actor.root.position.x,deltaZ=dest.z-a.actor.root.position.z,walk=Math.hypot(deltaX,deltaZ)>.1;
        dest.y=groundHeight(dest.x,dest.z);
        if(walk)a.actor.root.rotation.y=dampAngle(a.actor.root.rotation.y,Math.atan2(deltaX,deltaZ),12,dt);
        const peerSpeed=Math.min(14,Math.hypot(deltaX,deltaZ)*6);a.actor.root.position.lerp(dest,1-Math.exp(-6*dt));
        a.tag.visible=!closeInspection;
        a.actor.root.visible=Math.hypot(dest.x-p.x,dest.z-p.y)<200;
        if(a.actor.root.visible)a.actor.animate(now/1000,walk,peer.gesture,peer.item==='bicicleta'&&!caveAt(dest.x,dest.z),{speed:peerSpeed,air:0,landing:0,item:peer.item,cyclePhase:a.item.phase});
        if(a.itemId!==peer.item){a.item.dispose();a.item=createEquipment(a.actor,scene,peer.item);a.itemId=peer.item}
        a.item.root.visible=a.actor.root.visible;
        a.item.update({time:now/1000,dt,x:dest.x,y:dest.y,z:dest.z,heading:a.actor.root.rotation.y,speed:peerSpeed,distance:walk?peerSpeed*dt:0,mounted:peer.item==='bicicleta'&&!caveAt(dest.x,dest.z),light:true,observing:false,action:0,playing:false,height:groundHeight,obstacles:queryObstacles});
      }
      if (now - published > 150) {
        published = now;
        const forestCells=scene.userData.forestLods as T.LOD[]|undefined;
        if(forestCells)for(const lod of forestCells){const distance=Math.hypot(lod.position.x-p.x,lod.position.z-p.y);lod.levels.forEach((level,i)=>level.object.visible=i===(distance<125?0:distance<460?1:2))}
        latest.current.onMove((p.x / SIZE) * 100 + 50,(p.y / SIZE) * 100 + 50,itemId==='bicicleta'&&!bike?'':itemId);
        setCoords(prev=>prev.x===Math.round(p.x)&&prev.z===Math.round(p.y)?prev:{x:Math.round(p.x),z:Math.round(p.y)});
        if(showPerformanceRef.current&&container.dataset.performance){const stats=JSON.parse(container.dataset.performance);setPerformanceText(`${stats.fps} FPS · quadro p95 ${stats.p95} ms · ${stats.calls} desenhos · ${stats.triangles.toLocaleString('pt-BR')} triângulos`)}
        const goal=waypoint.current??discoveries.reduce<(typeof discoveries)[number]|undefined>((best,g)=>latest.current.foundIds.includes(g.id)?best:!best||Math.hypot(g.x-p.x,g.z-p.y)<Math.hypot(best.x-p.x,best.z-p.y)?g:best,undefined);
        const bearing=goal?Math.atan2(goal.x-p.x,-(goal.z-p.y))*180/Math.PI:0;
        setHud({energy:Math.round(r.energy),water:r.water,cave:inside?.name??'',heading:actor.root.rotation.y,light:r.light,observing:r.observing,mounted:r.mounted,message:r.messageUntil>now?r.message:'',bearing:goal?`${goal.name} · ${Math.round((bearing+360)%360)}°`:'Coleção completa',distance:goal?Math.round(Math.hypot(goal.x-p.x,goal.z-p.y)):0,action:r.action?.kind==='drink'?'Bebendo água':r.action?.kind==='refill'?'Reabastecendo cantil':'',progress:r.action?r.action.elapsed/r.action.duration:0,canRefill:[{x:-24,z:18},...places.filter(v=>['rio','cachoeira'].includes(v.id))].some(v=>Math.hypot(v.x-p.x,v.z-p.y)<12)});
        setNearReward((!inside||hasLight)?discoveries.find(r=>!latest.current.foundIds.includes(r.id)&&Math.hypot(r.x-p.x,r.z-p.y)<3.5)??null:null);
        setNear(
          places.reduce((a, b) =>
            Math.hypot(p.x - a.x, p.y - a.z) < Math.hypot(p.x - b.x, p.y - b.z)
              ? a
              : b,
          ),
        );
      }
      world.animate(now/1000,camera,caveBlend);
      for(const {reward,root,gem,tag} of treasureMeshes){root.visible=!latest.current.foundIds.includes(reward.id);root.position.y=terrainHeight(reward.x,reward.z)+1.1+Math.sin(now*.002+reward.x)*.13;gem.rotation.y=now*.001;tag.visible=!closeInspection&&Math.hypot(reward.x-p.x,reward.z-p.y)<22}
      const firstPerson=r.observing&&latest.current.item==='binoculos';
      name.visible=!inside&&!covered&&!overviewRef.current&&!closeInspection;
      cameraDistance+=((firstPerson?8:overviewRef.current?1100:distance)-cameraDistance)*(1-Math.exp(-10*dt));
      cameraYaw=dampAngle(cameraYaw,yaw,16,dt);
      desiredLook.set(p.x,motion.y+1.2-motion.landing*.035,p.y);lookTarget.lerp(desiredLook,1-Math.exp(-20*dt));
      const inCover=!!covered&&!overviewRef.current;
      coverBlend+=(Number(inCover)-coverBlend)*(1-Math.exp(-7*dt));
      camera=firstPerson?eyeCamera:inCover||coverBlend>.002?coveredView:isoCamera;
      container.dataset.camera=inCover?'proximidade':firstPerson?'binóculos':'isométrica';
      container.dataset.cover=covered;
      if(firstPerson){eyeCamera.position.set(p.x,motion.y+1.75,p.y);eyeCamera.lookAt(p.x-Math.sin(cameraYaw)*50,motion.y+1.75+(pitch-.615)*30,p.y-Math.cos(cameraYaw)*50)}
      else if(camera===coveredView){
       const wanted=cameraBoom(p.x,p.y,cameraYaw,3.5,queryObstacles);
       // Pull in immediately when blocked; ease outward to avoid passing through walls.
       coverBoom=wanted<coverBoom?wanted:coverBoom+(wanted-coverBoom)*(1-Math.exp(-5*dt));
       const framing=coveredFraming(coverBlend,cameraDistance,coverBoom);
       coveredView.aspect=container.clientWidth/Math.max(1,container.clientHeight);coveredView.fov=framing.fov;coveredView.far=2400;coveredView.updateProjectionMatrix();
       const anchor=lookTarget;
       coveredView.position.set(anchor.x+Math.sin(cameraYaw)*framing.horizontal,anchor.y+framing.rise,anchor.z+Math.cos(cameraYaw)*framing.horizontal);
       coveredView.lookAt(anchor);
      }
      else{
       const aspect=container.clientWidth/Math.max(1,container.clientHeight),half=cameraDistance/2;
       if(Math.abs(isoCamera.top-half)>.001||Math.abs(isoCamera.right-half*aspect)>.001){isoCamera.left=-half*aspect;isoCamera.right=half*aspect;isoCamera.top=half;isoCamera.bottom=-half;isoCamera.updateProjectionMatrix()}
       const anchor=overviewRef.current?new T.Vector3(0,20,0):lookTarget;
       isoCamera.position.set(anchor.x+Math.sin(cameraYaw)*300,anchor.y+Math.tan(Math.atan(1/Math.sqrt(2)))*300,anchor.z+Math.cos(cameraYaw)*300);isoCamera.lookAt(anchor);
      }
      actor.root.visible=!firstPerson;
      const focus=scene.userData.forestFocus as {value:T.Vector3}|undefined;focus?.value.set(p.x,motion.y,p.y);
      const forestDirection=scene.userData.forestDirection as {value:T.Vector2}|undefined;forestDirection?.value.set(Math.sin(cameraYaw),Math.cos(cameraYaw));
      if(appliedQuality!==qualityRef.current){appliedQuality=qualityRef.current;autoScale=1;configureRenderer(renderer,appliedQuality,autoScale)}
      if(now-lastTuning>6000&&appliedQuality==='auto'&&container.dataset.performance){lastTuning=now;const stats=JSON.parse(container.dataset.performance);autoScale=T.MathUtils.clamp(autoScale+(stats.fps<42?-.1:stats.fps>58?.05:0),.75,1);configureRenderer(renderer,appliedQuality,autoScale)}
      if (!document.hidden) renderer.render(scene, camera);
      profileFrame(now);
      frame = requestAnimationFrame(tick);
    };
    isoCamera.position.set(30,30,30);
    let visible=true;
    const resume=()=>{if(visible&&!document.hidden&&!frame){last=performance.now();profileFrame.reset();frame=requestAnimationFrame(tick)}};
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;reset()}else resume()};
    const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(!visible){cancelAnimationFrame(frame);frame=0;reset()}else resume()});intersection.observe(container);
    document.addEventListener('visibilitychange',visibility);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      sun.shadow.dispose();renderer.dispose();
      container.replaceChildren();
      equipped.dispose();for(const a of actors.values())a.item.dispose();disposeScene(scene);
    };
  }, [props.profile.avatar, props.profile.nickname, props.vip]);
  function start(e: PointerEvent<HTMLDivElement>) {
    if (
      latest.current.paused ||
      (e.target as HTMLElement).closest("button,a,details,input,select,.field-map,.gear-hud")
    )
      return;
    surface.current?.focus();
    const rect = e.currentTarget.getBoundingClientRect();
    const kind =
      e.pointerType !== "mouse" && e.clientX - rect.left < rect.width * 0.48
        ? "walk"
        : "camera";
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY, kind });
    if(kind==="walk")setJoystick({x:e.clientX-rect.left,y:e.clientY-rect.top});
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const t = touches.current.get(e.pointerId);
    if (!t) return;
    const dx = e.clientX - t.x,
      dy = e.clientY - t.y;
    if (t.kind === "camera") {
      view.current.yaw -= dx * 0.006;
      view.current.pitch = Math.max(
        0.25,
        Math.min(1.25, view.current.pitch + dy * 0.004),
      );
      t.x = e.clientX;
      t.y = e.clientY;
    } else {
      const scale = Math.max(1, Math.hypot(dx, dy) / 45);
      input.current.x = dx / scale / 45;
      input.current.z = dy / scale / 45;
      if(stick.current)stick.current.style.transform=`translate(${dx/scale}px,${dy/scale}px)`;
    }
  }
  function stop(e: PointerEvent<HTMLDivElement>) {
    const t = touches.current.get(e.pointerId);
    if (t?.kind === "walk"){input.current.x=input.current.z=0;setJoystick(null)}
    touches.current.delete(e.pointerId);
  }
  const nearby = props.players.filter(
    (p) => Math.hypot((p.x - 50)*SIZE/100 - coords.x, (p.y - 50)*SIZE/100 - coords.z) < 12,
  );
  return (
    <section
      ref={section}
      className={`lobby-world isometric-world ${expanded ? "expanded" : ""}`}
    >
      <div className="lobby-mapbar">
        <div>
          <LocateFixed size={15} />
          <strong>{near.name}</strong>
        </div>
        <div>
          <button
            onClick={() => {
              view.current = { yaw: Math.PI/4, pitch: Math.atan(1/Math.sqrt(2)), distance: 30 };setOverview(false);
            }}
            aria-label="Centralizar câmera isométrica"
          >
            <LocateFixed size={17} />
          </button>
          <button onClick={()=>{view.current.yaw-=Math.PI/2;surface.current?.focus()}} aria-label="Girar câmera à esquerda · Q"><RotateCcw size={16}/></button>
          <button onClick={()=>{view.current.yaw+=Math.PI/2;surface.current?.focus()}} aria-label="Girar câmera à direita · R"><RotateCw size={16}/></button>
          <button className="view-switch" aria-pressed={overview} aria-label={overview?'Voltar ao personagem':'Ver toda a região'} onClick={()=>setOverview(v=>!v)}><Binoculars size={16}/><span>{overview?'Personagem':'Região'}</span></button>
          <select className="graphics-select" aria-label="Qualidade gráfica" value={quality} onChange={e=>{const q=e.target.value as GraphicQuality;setQuality(q);try{localStorage.setItem('trilha.graphics',q)}catch{}surface.current?.focus()}}><option value="auto">Gráficos: auto</option><option value="high">Gráficos: alta</option><option value="economy">Gráficos: leve</option></select>
          <button onClick={() => setMapExpanded(v=>!v)} aria-label="Abrir mapa de localização detalhado"><MapIcon size={17}/></button>
          <button
            onClick={() => setHelp(!help)}
            aria-label="Ajuda de controles"
          >
            ?
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={
              fullscreen || expanded
                ? "Sair da tela cheia"
                : "Tela cheia somente do mapa"
            }
          >
            {fullscreen || expanded ? (
              <Minimize size={18} />
            ) : (
              <Maximize size={18} />
            )}
            <span>{fullscreen || expanded ? "Reduzir" : "Tela cheia"}</span>
          </button>
        </div>
      </div>
      <div
        data-position={`${coords.x},${coords.z}`}
        ref={surface}
        className="lobby-surface"
        style={{touchAction:mapExpanded?"pan-y":"none"}}
        tabIndex={0}
        aria-label="Mapa do lobby. WASD ou setas para andar. Arraste para girar a câmera."
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onWheel={(e) => {
          if((e.target as HTMLElement).closest(".field-map,.quickbelt"))return;
          view.current.distance = Math.max(
            7,
            Math.min(100, view.current.distance + Math.sign(e.deltaY) * 2),
          );
        }}
      >
        <div className="lobby-renderer" ref={host} />
        {joystick&&<div className="floating-stick" style={{left:joystick.x,top:joystick.y}} aria-hidden="true"><div ref={stick}/></div>}
        <button className="jump-button" aria-label="Pular" onClick={()=>{input.current.jump=true;surface.current?.focus()}}>Pular <small>Espaço</small></button>
        {hud.observing&&props.item==='binoculos'&&<div className="binocular-view" aria-hidden="true"><span>+</span></div>}
        <div className="place-caption">
          <strong>{near.name}</strong>
          <span>{near.description}</span>
        </div>
        <FieldMap onNavigate={p=>{waypoint.current=p;setMapExpanded(false);surface.current?.focus()}} x={coords.x} z={coords.z} heading={hud.heading} expanded={mapExpanded} onToggle={()=>setMapExpanded(v=>!v)}/>
        {!mapExpanded&&!showPerformance&&<div className="expedition-goal"><b>{waypoint.current?'Destino marcado':'Próxima descoberta'}</b><p>{hud.bearing.split(' · ')[0]} · {hud.distance} m</p>{waypoint.current&&<button onClick={()=>{waypoint.current=null}}>Limpar destino</button>}</div>}
        {!mapExpanded&&<Quickbelt item={props.item} onEquip={id=>{equip(id);surface.current?.focus()}}/>}
        {!mapExpanded&&<div className="gear-hud">
          <label>Equipamento <select value={props.item} onChange={e=>{equip(e.target.value);surface.current?.focus()}}><option value="">Mãos livres</option>{gearIds.map(id=><option key={id} value={id}>{({mapa:'Mapa',bicicleta:'Bicicleta',pet:'Companheiro',lanterna:'Lanterna',cantil:'Cantil',corda:'Corda',bussola:'Bússola',binoculos:'Binóculos',botas:'Botas',capacete:'Capacete com luz'} as Record<string,string>)[id]}</option>)}</select></label>
          <span>Energia {hud.energy}% <progress value={hud.energy} max={100}/></span>
          {hud.cave&&<strong>{hud.cave} · {['lanterna','capacete'].includes(props.item)&&hud.light?'luz ligada':'equipe uma fonte de luz'}</strong>}
          {props.item==='bussola'&&<strong>↑ N · {hud.bearing} · {hud.distance} m</strong>}
          {props.item==='pet'&&hud.distance<30&&<strong>Seu companheiro encontrou uma pista a {hud.distance} m</strong>}
          {['mapa','bicicleta','lanterna','capacete','binoculos','cantil','corda','bussola','pet'].includes(props.item)&&<button disabled={!!hud.action} onClick={()=>{useItem.current();surface.current?.focus()}}>{hud.action|| (props.item==='mapa'?'Abrir e consultar o mapa':props.item==='bussola'?'Orientar câmera ao norte':props.item==='pet'?'Farejar / brincar':props.item==='bicicleta'?(hud.mounted?'Descer da bicicleta':'Montar bicicleta'):props.item==='cantil'?`Beber água · ${hud.water}/3`:props.item==='corda'?'Fixar corda na ravina':props.item==='binoculos'?(hud.observing?'Guardar binóculos':'Observar com binóculos'):(hud.light?'Desligar luz':'Ligar luz'))} · F</button>}
          {props.item==='cantil'&&hud.canRefill&&hud.water<3&&<button disabled={!!hud.action} onClick={()=>{useItem.current('refill');surface.current?.focus()}}>Reabastecer cantil · G</button>}
          {props.item==='botas'&&<strong>Botas calçadas · aderência nas subidas</strong>}
          {props.item&&<button onClick={()=>{view.current.distance=8;setOverview(false);surface.current?.focus()}}>Ver equipamento de perto</button>}
          {hud.action&&<progress value={hud.progress} max={1} aria-label={hud.action}/>}
          {hud.message&&<p role="status">{hud.message}</p>}
        </div>}
        <div className="lobby-zoom">
          <button
            onClick={() =>
              (view.current.distance = Math.max(8, view.current.distance - 3))
            }
            aria-label="Aproximar câmera"
          >
            +
          </button>
          <button
            onClick={() =>
              (view.current.distance = Math.min(100, view.current.distance + 3))
            }
            aria-label="Afastar câmera"
          >
            −
          </button>
        </div>
        <div className="lobby-instructions">
          <kbd>W A S D</kbd>
          <span> andar · arraste para olhar</span>
          <small>Celular: mova à esquerda, olhe à direita</small>
        </div>
        <button
          className={`run-button ${run ? "selected" : ""}`}
          onClick={() => {
            input.current.run = !run;
            setRun(!run);
            surface.current?.focus();
          }}
          aria-pressed={run}
        >
          Correr
        </button>
        {near.id === "vip" && (
          <button
            className="place-interact"
            onClick={() => void openPanel(props.onVip)}
          >
            {props.vip
              ? "Seu acesso VIP está liberado"
              : "Conhecer o Refúgio VIP"}{" "}
            →
          </button>
        )}
        {nearReward && !props.foundIds.includes(nearReward.id) && !mapExpanded && <button className="discover-button" onClick={()=>props.onDiscover(nearReward)}><span>Descoberta por perto</span><strong>Recolher {nearReward.name}</strong><small>E ou toque aqui</small></button>}
        {nearby.length > 0 && (
          <div className="nearby-on-map">
            {nearby.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => void openPanel(() => props.onPlayer(p))}
              >
                <Hand size={14} />
                {p.nickname}
              </button>
            ))}
          </div>
        )}
        {showPerformance&&<output className="performance-readout">{performanceText}</output>}
        {error && (
          <div className="map-help" role="alert">
            {error}
          </div>
        )}
        {help && (
          <div className="map-help">
            <h3>Encontre sua turma.</h3>
            <p>
              Clique no cenário e use WASD ou as setas. Q e R giram a visão isométrica
              e use + e − para aproximar. Pressione E perto de uma descoberta para recolher. As teclas 1 a 0 equipam os itens da mochila. M abre o mapa; selecione um lugar e marque um destino. No celular, arraste o lado esquerdo
              para andar e o direito para girar a câmera.
            </p>
            <p>
              Escolha um jogador na lista para acenar, conversar ou silenciar. O
              mapa de campo mostra os lugares; a bicicleta aumenta a velocidade;
              o pet acompanha você e fareja descobertas. Use F ou os botões para montar a bicicleta, beber água, acender a luz e fixar a corda na ravina. Use G ou Reabastecer com o cantil perto da água. Cavernas são exploradas a pé; leve lanterna ou capacete com luz.
            </p>
            <label className="performance-toggle"><input type="checkbox" checked={showPerformance} onChange={e=>setShowPerformance(e.target.checked)}/> Exibir desempenho medido neste aparelho</label>
            <p>Espaço ou Pular: salto. Gráficos automáticos ajustam a resolução durante a exploração. Use Alta para priorizar detalhes ou Leve para reduzir o custo gráfico.</p>
            <button onClick={() => setHelp(false)}>Entendi</button>
          </div>
        )}
      </div>
    </section>
  );
}
