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
  Dog,
  LocateFixed,
} from "lucide-react";
import { person, label, disposeScene } from "../world/character";
import {createMotion,advanceMotion,obstacleIndex,dampAngle} from './motion';
import {configureRenderer,type GraphicQuality} from './rendering';
import { avatars } from "./profiles";
import { buildLobby, equipment, places, SIZE } from "./scene";
import type { Profile, Visitor } from "./useLobby";
import {BOUNDARY, terrainHeight, caveAt, ropeCrossing, discoveries, type Discovery} from './exploration';
import {movementSpeed,energyStep,gearIds} from './gear';
import FieldMap from './FieldMap';
import Quickbelt from './Quickbelt';
import {frameProfiler} from './diagnostics';
type Props = {
  profile: Profile;
  players: Visitor[];
  item: string;
  onEquip: (id:string)=>void;
  gesture: string;
  paused: boolean;
  vip: boolean;
  onMove: (x: number, y: number) => void;
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
  const resources=useRef({energy:100,water:3,light:true,observing:false,mounted:true,message:'',messageUntil:0,crossing:null as null|{from:{x:number;y:number};to:{x:number;y:number};start:number}});
  const useItem=useRef<()=>void>(()=>{});
  const [hud,setHud]=useState({energy:100,water:3,cave:'',heading:0,light:true,observing:false,mounted:true,message:'',bearing:'',distance:0});
  const [nearReward,setNearReward] = useState<Discovery|null>(null);
  const [coords, setCoords] = useState({ x: 0, z: 7 });
  const [petAction, setPetAction] = useState(""),
    petUntil = useRef(0);
  latest.current = { ...props, paused: props.paused || help || mapExpanded };
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
    const wallMaterials=new Set<T.Material>();scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])if(m.userData.caveWall)wallMaterials.add(m)});
    const wallPlane=new T.Plane(new T.Vector3(0,-1,0),0);let cutawayId='';
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
        item: T.Group;
        itemId: string;
        tag: T.Sprite;
        lastX: number;
        lastY: number;
        signature: string;
      }
    >();
    let equipped = equipment(latest.current.item),
      itemId = latest.current.item;
    actor.root.add(equipped);
    const beam=new T.SpotLight('#fff0bf',80,38,.6,.5,1.3);beam.position.set(.25,1.6,.2);beam.target.position.set(0,1.2,12);actor.root.add(beam,beam.target);
    const lampFill=new T.PointLight('#e6d4ad',8,6,2);lampFill.position.set(0,2.1,.15);actor.root.add(lampFill);

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
    let caveBlend=0,cameraDistance=view.current.distance,cameraYaw=view.current.yaw,autoScale=1,lastTuning=0,appliedQuality=qualityRef.current;
    useItem.current=()=>{
      const r=resources.current,item=latest.current.item;
      const tell=(text:string)=>{r.message=text;r.messageUntil=performance.now()+4000};
      if(item==='lanterna'||item==='capacete'){r.light=!r.light;tell(r.light?'Luz ligada':'Luz desligada')}
      else if(item==='bicicleta'){r.mounted=!r.mounted;tell(r.mounted?'Bicicleta montada: pedale com WASD ou analógico':'Você desceu da bicicleta')}
      else if(item==='binoculos')r.observing=!r.observing;
      else if(item==='cantil'){
        const waters=[{x:-24,z:18},...places.filter(v=>['rio','cachoeira'].includes(v.id))];
        if(waters.some(v=>Math.hypot(v.x-p.x,v.z-p.y)<15)&&r.water<3){r.water=3;tell('Cantil reabastecido: 3 doses')}
        else if(r.water>0){r.water--;r.energy=Math.min(100,r.energy+45);tell('Você bebeu água e recuperou energia')}
        else tell('Cantil vazio. Reabasteça perto do lago ou do riacho');
      }else if(item==='corda'){
        const from=ropeCrossing.from,to=ropeCrossing.to;
        const a=Math.hypot(p.x-from.x,p.y-from.z),b=Math.hypot(p.x-to.x,p.y-to.z);
        if(Math.min(a,b)<7&&!r.crossing){const dest=a<b?to:from;r.crossing={from:{...p},to:{x:dest.x,y:dest.z},start:performance.now()};tell('Corda fixada: atravessando a ravina')}
        else tell('Leve a corda a um ponto de ancoragem da ravina');
      }
    };
    const isoCamera=new T.OrthographicCamera(-30,30,30,-30,.1,2400),eyeCamera=new T.PerspectiveCamera(22,1,.1,180);
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
        "Lobby 3D com fogueira, barracas, lago, oficina e jogadores conectados",
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
      eyeCamera.aspect=w/h;eyeCamera.updateProjectionMatrix();
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
      const { yaw, pitch, distance } = view.current,
        wx = dx * Math.cos(yaw) + dz * Math.sin(yaw),
        wz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
      const r=resources.current,cave=caveAt(p.x,p.y),bike=latest.current.item==='bicicleta'&&r.mounted&&!cave;
      const slope=Math.abs(terrainHeight(p.x+Math.sin(actor.root.rotation.y)*2,p.y+Math.cos(actor.root.rotation.y)*2)-terrainHeight(p.x,p.y))/2;
      const sprint=input.current.run||keys.has('ShiftLeft');
      const speed=movementSpeed(bike?'bicicleta':latest.current.item==='bicicleta'?'':latest.current.item,sprint,r.energy,slope,!!cave);
      advanceMotion(motion,{x:wx,z:wz,speed,jump:input.current.jump,enabled,bike},dt,groundHeight,queryObstacles,BOUNDARY);input.current.jump=false;
      if(r.crossing){
        if(!enabled)r.crossing.start+=dt*1000;
        const t=Math.min(1,(now-r.crossing.start)/2400),smooth=t*t*(3-2*t);
        motion.x=r.crossing.from.x+(r.crossing.to.x-r.crossing.from.x)*smooth;motion.z=r.crossing.from.y+(r.crossing.to.y-r.crossing.from.y)*smooth;
        motion.y=groundHeight(motion.x,motion.z)+Math.sin(t*Math.PI)*.35;motion.vx=motion.vz=0;
        if(t>=1)r.crossing=null;
      }
      const moved=Math.hypot(motion.x-p.x,motion.z-p.y),moving=moved>.0005,actualSpeed=moved/Math.max(dt,.001);
      if(moving)actor.root.rotation.y=dampAngle(actor.root.rotation.y,Math.atan2(motion.x-p.x,motion.z-p.y),bike?9:18,dt);
      p.x=motion.x;p.y=motion.z;
      const altitude=groundHeight(p.x,p.y),air=Math.max(0,motion.y-altitude);
      actor.root.position.set(p.x,motion.y,p.y);
      actor.animate(now/1000,moving,latest.current.gesture,bike,{speed:actualSpeed,air,landing:motion.landing});
      if(enabled)r.energy=energyStep(r.energy,moving,sprint,bike,dt);
      const inside=caveAt(p.x,p.y),hasLight=['lanterna','capacete'].includes(latest.current.item)&&r.light;
      wallPlane.constant=motion.y+1.3;
      if((inside?.id??'')!==cutawayId){cutawayId=inside?.id??'';for(const m of wallMaterials){m.clippingPlanes=m.userData.caveWall===cutawayId?[wallPlane]:null;m.clipShadows=true;m.needsUpdate=true}}
      beam.visible=hasLight;lampFill.visible=hasLight&&!!inside;beam.intensity=latest.current.item==='capacete'?120:80;
      caveBlend+=(Number(!!inside)-caveBlend)*(1-Math.exp(-4*dt));
      ambient.intensity=T.MathUtils.lerp(1.65,.48,caveBlend);sun.intensity=T.MathUtils.lerp(2.6,.05,caveBlend);
      const fog=scene.fog as T.Fog;fog.color.copy(daylight).lerp(night,caveBlend);fog.near=resources.current.observing?8:380;fog.far=resources.current.observing?60:T.MathUtils.lerp(1100,650,caveBlend);
      (scene.background as T.Color).copy(fog.color);
      const shadowX=Math.round(p.x*16)/16,shadowZ=Math.round(p.y*16)/16;sun.position.set(shadowX-28,altitude+48,shadowZ+22);sun.target.position.set(shadowX,altitude,shadowZ);
      if (itemId !== latest.current.item) {
        actor.root.remove(equipped);
        disposeScene(equipped);
        itemId = latest.current.item; r.observing=false;r.mounted=true;
        equipped = equipment(itemId);
        actor.root.add(equipped);
      }
      if(itemId==='bicicleta'){
        equipped.visible=!inside;equipped.position.x=r.mounted?0:.8;
        for(const wheel of equipped.userData.wheels??[])if(moving&&bike)wheel.rotation.x+=moved/.48;
      }
      if (itemId === "pet") {
        equipped.rotation.y = Math.sin(now * 0.003) * 0.15;
        equipped.position.y =
          petUntil.current > now
            ? Math.abs(Math.sin(now * 0.009)) * 0.5
            : Math.sin(now * 0.005) * 0.04;
      }
      const ids = new Set(latest.current.players.map((v) => v.id));
      for (const [id, a] of actors)
        if (!ids.has(id)) {
          scene.remove(a.actor.root);
          disposeScene(a.actor.root);
          actors.delete(id);
        }
      for (const peer of latest.current.players) {
        let a = actors.get(peer.id);
        const signature = `${peer.nickname}:${peer.avatar}`;
        if (a && a.signature !== signature) {
          scene.remove(a.actor.root); disposeScene(a.actor.root); actors.delete(peer.id); a = undefined;
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
          const item = equipment(peer.item);
          other.root.add(item);
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
        a.actor.root.visible=Math.hypot(dest.x-p.x,dest.z-p.y)<200;
        if(a.actor.root.visible)a.actor.animate(now/1000,walk,peer.gesture,peer.item==='bicicleta'&&!caveAt(dest.x,dest.z),{speed:peerSpeed,air:0,landing:0});
        if(a.itemId==='bicicleta'){a.item.visible=!caveAt(dest.x,dest.z);for(const wheel of a.item.userData.wheels??[])if(walk)wheel.rotation.x+=14*dt/.48}
        if (a.itemId !== peer.item) {
          a.actor.root.remove(a.item);
          disposeScene(a.item);
          a.item = equipment(peer.item);
          a.itemId = peer.item;
          a.actor.root.add(a.item);
        }
      }
      if (now - published > 150) {
        published = now;
        const forestCells=scene.userData.forestLods as T.LOD[]|undefined;
        if(forestCells)for(const lod of forestCells){const distance=Math.hypot(lod.position.x-p.x,lod.position.z-p.y);lod.levels.forEach((level,i)=>level.object.visible=i===(distance<125?0:distance<460?1:2))}
        latest.current.onMove((p.x / SIZE) * 100 + 50, (p.y / SIZE) * 100 + 50);
        setCoords(prev=>prev.x===Math.round(p.x)&&prev.z===Math.round(p.y)?prev:{x:Math.round(p.x),z:Math.round(p.y)});
        if(showPerformanceRef.current&&container.dataset.performance){const stats=JSON.parse(container.dataset.performance);setPerformanceText(`${stats.fps} FPS · quadro p95 ${stats.p95} ms · ${stats.calls} desenhos · ${stats.triangles.toLocaleString('pt-BR')} triângulos`)}
        const goal=waypoint.current??discoveries.reduce<(typeof discoveries)[number]|undefined>((best,g)=>latest.current.foundIds.includes(g.id)?best:!best||Math.hypot(g.x-p.x,g.z-p.y)<Math.hypot(best.x-p.x,best.z-p.y)?g:best,undefined);
        const bearing=goal?Math.atan2(goal.x-p.x,-(goal.z-p.y))*180/Math.PI:0;
        setHud({energy:Math.round(r.energy),water:r.water,cave:inside?.name??'',heading:actor.root.rotation.y,light:r.light,observing:r.observing,mounted:r.mounted,message:r.messageUntil>now?r.message:'',bearing:goal?`${goal.name} · ${Math.round((bearing+360)%360)}°`:'Coleção completa',distance:goal?Math.round(Math.hypot(goal.x-p.x,goal.z-p.y)):0});
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
      for(const {reward,root,gem,tag} of treasureMeshes){root.visible=!latest.current.foundIds.includes(reward.id);root.position.y=terrainHeight(reward.x,reward.z)+1.1+Math.sin(now*.002+reward.x)*.13;gem.rotation.y=now*.001;tag.visible=Math.hypot(reward.x-p.x,reward.z-p.y)<22}
      const firstPerson=r.observing&&latest.current.item==='binoculos';
      name.visible=!inside&&!overviewRef.current;
      cameraDistance+=((firstPerson?8:overviewRef.current?950:inside?22:distance)-cameraDistance)*(1-Math.exp(-10*dt));
      cameraYaw=dampAngle(cameraYaw,yaw,16,dt);
      desiredLook.set(p.x,motion.y+1.2-motion.landing*.035,p.y);lookTarget.lerp(desiredLook,1-Math.exp(-20*dt));
      camera=firstPerson?eyeCamera:isoCamera;
      if(firstPerson){eyeCamera.position.set(p.x,motion.y+1.75,p.y);eyeCamera.lookAt(p.x-Math.sin(cameraYaw)*50,motion.y+1.75+(pitch-.615)*30,p.y-Math.cos(cameraYaw)*50)}
      else{
       const aspect=container.clientWidth/Math.max(1,container.clientHeight),half=cameraDistance/2;
       if(Math.abs(isoCamera.top-half)>.001||Math.abs(isoCamera.right-half*aspect)>.001){isoCamera.left=-half*aspect;isoCamera.right=half*aspect;isoCamera.top=half;isoCamera.bottom=-half;isoCamera.updateProjectionMatrix()}
       const anchor=overviewRef.current?new T.Vector3(0,20,0):lookTarget;
       isoCamera.position.set(anchor.x+Math.sin(cameraYaw)*300,anchor.y+Math.tan(Math.atan(1/Math.sqrt(2)))*300,anchor.z+Math.cos(cameraYaw)*300);isoCamera.lookAt(anchor);
      }
      actor.root.visible=!firstPerson;
      const focus=scene.userData.forestFocus as {value:T.Vector3}|undefined;focus?.value.set(p.x,motion.y,p.y);
      const forestDirection=scene.userData.forestDirection as {value:T.Vector2}|undefined;forestDirection?.value.set(Math.sin(cameraYaw),Math.cos(cameraYaw));
      const roofs=scene.userData.caveRoofs as Map<string,T.Group>|undefined;if(roofs)for(const [id,roof]of roofs)roof.visible=inside?.id!==id;
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
      disposeScene(scene);
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
        <div className="place-caption">
          <strong>{near.name}</strong>
          <span>{near.description}</span>
        </div>
        <FieldMap onNavigate={p=>{waypoint.current=p;setMapExpanded(false);surface.current?.focus()}} x={coords.x} z={coords.z} heading={hud.heading} expanded={mapExpanded} onToggle={()=>setMapExpanded(v=>!v)}/>
        {!mapExpanded&&!showPerformance&&<div className="expedition-goal"><b>{waypoint.current?'Destino marcado':'Próxima descoberta'}</b><p>{hud.bearing.split(' · ')[0]} · {hud.distance} m</p>{waypoint.current&&<button onClick={()=>{waypoint.current=null}}>Limpar destino</button>}</div>}
        {!mapExpanded&&<Quickbelt item={props.item} onEquip={id=>{props.onEquip(id);surface.current?.focus()}}/>}
        {!mapExpanded&&<div className="gear-hud">
          <label>Equipamento <select value={props.item} onChange={e=>{props.onEquip(e.target.value);surface.current?.focus()}}><option value="">Mãos livres</option>{gearIds.map(id=><option key={id} value={id}>{({mapa:'Mapa',bicicleta:'Bicicleta',pet:'Companheiro',lanterna:'Lanterna',cantil:'Cantil',corda:'Corda',bussola:'Bússola',binoculos:'Binóculos',botas:'Botas',capacete:'Capacete com luz'} as Record<string,string>)[id]}</option>)}</select></label>
          <span>Energia {hud.energy}% <progress value={hud.energy} max={100}/></span>
          {hud.cave&&<strong>{hud.cave} · {['lanterna','capacete'].includes(props.item)&&hud.light?'luz ligada':'equipe uma fonte de luz'}</strong>}
          {props.item==='bussola'&&<strong>↑ N · {hud.bearing} · {hud.distance} m</strong>}
          {props.item==='pet'&&hud.distance<30&&<strong>Seu companheiro encontrou uma pista a {hud.distance} m</strong>}
          {['bicicleta','lanterna','capacete','binoculos','cantil','corda'].includes(props.item)&&<button onClick={()=>{useItem.current();surface.current?.focus()}}>{props.item==='bicicleta'?(hud.mounted?'Descer da bicicleta':'Montar bicicleta'):props.item==='cantil'?`Beber / reabastecer · ${hud.water}/3`:props.item==='corda'?'Fixar corda na ravina':props.item==='binoculos'?(hud.observing?'Guardar binóculos':'Observar com binóculos'):(hud.light?'Desligar luz':'Ligar luz')} · F</button>}
          {hud.message&&<p role="status">{hud.message}</p>}
        </div>}
        <div className="lobby-zoom">
          <button
            onClick={() =>
              (view.current.distance = Math.max(14, view.current.distance - 3))
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
        {props.item === "pet" && (
          <button
            className="pet-interact"
            onClick={() => {
              petUntil.current = performance.now() + 4000;
              setPetAction("Seu companheiro está brincando!");
              window.setTimeout(() => setPetAction(""), 4000);
            }}
          >
            <Dog size={16} />
            {petAction || "Brincar com meu pet"}
          </button>
        )}
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
              o pet acompanha você e fareja descobertas. Use F ou os botões para montar a bicicleta, beber água, acender a luz e fixar a corda na ravina. Cavernas são exploradas a pé; leve lanterna ou capacete com luz.
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
