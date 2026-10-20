import { useEffect, useRef, useState, type PointerEvent } from "react";
import * as T from "three";
import {
  Maximize,
  Minimize,
  RotateCcw,
  Map as MapIcon,
  Hand,
  Dog,
  LocateFixed,
} from "lucide-react";
import { person, label, disposeScene } from "../world/character";
import { stepPosition } from "../world/physics";
import { avatars } from "../gameData";
import { buildLobby, equipment, places, SIZE } from "./scene";
import type { Profile, Visitor } from "./useLobby";
import {BOUNDARY, terrainHeight, caveAt, ropeCrossing, discoveries, type Discovery} from './exploration';
import {movementSpeed,energyStep,gearIds} from './gear';
import FieldMap from './FieldMap';
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
  const view = useRef({ yaw: 0, pitch: 0.65, distance: 22 }),
    input = useRef({ x: 0, z: 0, run: false });
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
    scene.fog = new T.Fog("#c2d4c6", 220, 700);
    const ambient=new T.HemisphereLight("#fff3d9", "#4e7054", 2.4); scene.add(ambient);
    const sun = new T.DirectionalLight("#fff2d2", 3);
    sun.position.set(-25, 45, 20);
    scene.add(sun);
    const world = buildLobby(scene, props.vip);
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

    let p = {
        x: props.initialPosition?.x ?? Math.random() * 4 - 2,
        y: props.initialPosition?.z ?? (props.vip ? -31 : 7 + Math.random() * 2),
      },
      frame = 0,
      last = performance.now(),
      published = 0;
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
    const camera = new T.PerspectiveCamera(48, 1, 0.1, 2400),
      keys = new Set<string>(),
      target = new T.Vector3();
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.toneMapping = T.ACESFilmicToneMapping;
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
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const reset = () => {
      keys.clear();
      input.current.x = input.current.z = 0;
      touches.current.clear();
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
      if(e.code==='KeyF'&&!e.repeat){e.preventDefault();useItem.current()}
      if(e.code==='KeyE'&&!e.repeat){if(caveAt(p.x,p.y)&&!(['lanterna','capacete'].includes(latest.current.item)&&resources.current.light))return;const reward=discoveries.find(r=>!latest.current.foundIds.includes(r.id)&&Math.hypot(r.x-p.x,r.z-p.y)<3.5);if(reward)latest.current.onDiscover(reward)}
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
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
      const closeObstacles=world.obstacles.filter(o=>Math.abs(o.x-p.x)<o.width/2+4&&Math.abs(o.z-p.y)<o.depth/2+4);
      let next=stepPosition(p,wx,wz,dt,speed,closeObstacles,BOUNDARY);
      if(!enabled&&r.crossing)r.crossing.start+=dt*1000;
      if(r.crossing){const t=Math.min(1,(now-r.crossing.start)/2400);next={x:r.crossing.from.x+(r.crossing.to.x-r.crossing.from.x)*t,y:r.crossing.from.y+(r.crossing.to.y-r.crossing.from.y)*t};if(t>=1)r.crossing=null}
      const moving = Math.hypot(next.x - p.x, next.y - p.y) > 0.001;
      if (moving) actor.root.rotation.y = Math.atan2(wx, wz);
      p = next;
      const altitude=terrainHeight(p.x,p.y);
      actor.root.position.set(p.x, altitude, p.y);
      actor.animate(now / 1000, moving, latest.current.gesture,bike);
      if(enabled)r.energy=energyStep(r.energy,moving,sprint,bike,dt);
      const inside=caveAt(p.x,p.y);
      const hasLight=['lanterna','capacete'].includes(latest.current.item)&&r.light;
      beam.visible=hasLight;beam.intensity=latest.current.item==='capacete'?120:80;
      ambient.intensity=inside ? .12 : 2.4;sun.intensity=inside ? .05 : 3;
      const fog=scene.fog as T.Fog;fog.color.set(inside?'#1e2824':'#c2d4c6');fog.near=inside?10:220;fog.far=inside?75:1300;
      (scene.background as T.Color).set(inside?'#1e2824':'#c2d4c6');
      if (itemId !== latest.current.item) {
        actor.root.remove(equipped);
        disposeScene(equipped);
        itemId = latest.current.item; r.observing=false;r.mounted=true;
        equipped = equipment(itemId);
        actor.root.add(equipped);
      }
      if(itemId==='bicicleta'){
        equipped.visible=!inside;equipped.position.x=r.mounted?0:.8;
        for(const wheel of equipped.userData.wheels??[])if(moving&&bike)wheel.rotation.x+=speed*dt/.48;
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
        const dest = new T.Vector3(
            ((peer.x - 50) * SIZE) / 100,
            0,
            ((peer.y - 50) * SIZE) / 100,
          ),
          delta = dest.clone().sub(a.actor.root.position),
          walk = Math.hypot(delta.x, delta.z) > 0.1;
        dest.y=terrainHeight(dest.x,dest.z);
        if (walk) a.actor.root.rotation.y = Math.atan2(delta.x, delta.z);
        a.actor.root.position.lerp(dest, 1 - Math.exp(-6 * dt));
        a.actor.animate(now / 1000, walk, peer.gesture,peer.item==="bicicleta"&&!caveAt(dest.x,dest.z));
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
        latest.current.onMove((p.x / SIZE) * 100 + 50, (p.y / SIZE) * 100 + 50);
        setCoords({ x: Math.round(p.x), z: Math.round(p.y) });
        const goal=discoveries.filter(g=>!latest.current.foundIds.includes(g.id)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.y)-Math.hypot(b.x-p.x,b.z-p.y))[0];
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
      world.animate(now / 1000);
      for(const {reward,root,gem,tag} of treasureMeshes){root.visible=!latest.current.foundIds.includes(reward.id);root.position.y=terrainHeight(reward.x,reward.z)+1.1+Math.sin(now*.002+reward.x)*.13;gem.rotation.y=now*.001;tag.visible=Math.hypot(reward.x-p.x,reward.z-p.y)<22}
      const firstPerson=r.observing&&latest.current.item==='binoculos';
      const actualDistance=inside?3.4:distance,actualPitch=inside ? .22 : pitch;
      target.set(p.x+Math.sin(yaw)*Math.cos(actualPitch)*actualDistance,altitude+1.5+Math.sin(actualPitch)*actualDistance,p.y+Math.cos(yaw)*Math.cos(actualPitch)*actualDistance);
      camera.position.lerp(target,1-Math.exp(-8*dt));
      camera.position.y=Math.max(camera.position.y,terrainHeight(camera.position.x,camera.position.z)+2);
      const fov=firstPerson?20:48;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}actor.root.visible=!firstPerson;
      if(firstPerson){camera.position.set(p.x,altitude+1.75,p.y);camera.lookAt(p.x-Math.sin(yaw)*50,altitude+1.75+(pitch-.65)*30,p.y-Math.cos(yaw)*50)}
      else if(inside){camera.position.y=altitude+2.8;camera.lookAt(p.x-Math.sin(yaw)*3,altitude+1.5,p.y-Math.cos(yaw)*3)}
      else camera.lookAt(p.x,altitude+1,p.y-2);
      if (!document.hidden) renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    camera.position.set(0, 18, 24);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      renderer.dispose();
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
    }
  }
  function stop(e: PointerEvent<HTMLDivElement>) {
    const t = touches.current.get(e.pointerId);
    if (t?.kind === "walk") input.current.x = input.current.z = 0;
    touches.current.delete(e.pointerId);
  }
  const nearby = props.players.filter(
    (p) => Math.hypot((p.x - 50)*SIZE/100 - coords.x, (p.y - 50)*SIZE/100 - coords.z) < 12,
  );
  return (
    <section
      ref={section}
      className={`lobby-world ${expanded ? "expanded" : ""}`}
    >
      <div className="lobby-mapbar">
        <div>
          <LocateFixed size={15} />
          <strong>{near.name}</strong>
        </div>
        <div>
          <button
            onClick={() => {
              view.current = { yaw: 0, pitch: 0.65, distance: 22 };
            }}
            aria-label="Centralizar câmera"
          >
            <RotateCcw size={17} />
          </button>
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
          view.current.distance = Math.max(
            7,
            Math.min(1100, view.current.distance + Math.sign(e.deltaY) * 2),
          );
        }}
      >
        <div className="lobby-renderer" ref={host} />
        <div className="place-caption">
          <strong>{near.name}</strong>
          <span>{near.description}</span>
        </div>
        <FieldMap x={coords.x} z={coords.z} heading={hud.heading} expanded={mapExpanded} onToggle={()=>setMapExpanded(v=>!v)}/>
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
              (view.current.distance = Math.max(7, view.current.distance - 3))
            }
            aria-label="Aproximar câmera"
          >
            +
          </button>
          <button
            onClick={() =>
              (view.current.distance = Math.min(1100, view.current.distance + 3))
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
        {error && (
          <div className="map-help" role="alert">
            {error}
          </div>
        )}
        {help && (
          <div className="map-help">
            <h3>Encontre sua turma.</h3>
            <p>
              Clique no mapa e use WASD ou as setas. Arraste para girar a câmera
              e use + e − para aproximar. Pressione E perto de uma descoberta para recolher. O ícone de mapa na barra abre a vista da região. No celular, arraste o lado esquerdo
              para andar e o direito para olhar.
            </p>
            <p>
              Escolha um jogador na lista para acenar, conversar ou silenciar. O
              mapa de campo mostra os lugares; a bicicleta aumenta a velocidade;
              o pet acompanha você e fareja descobertas. Use F ou os botões para montar a bicicleta, beber água, acender a luz e fixar a corda na ravina. Cavernas são exploradas a pé; leve lanterna ou capacete com luz.
            </p>
            <button onClick={() => setHelp(false)}>Entendi</button>
          </div>
        )}
      </div>
    </section>
  );
}
