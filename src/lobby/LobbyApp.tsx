import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Award,
  Compass,
  Users,
  MessageCircle,
  Backpack,
  LogOut,
  ArrowRight,
  RefreshCw,
  Hand,
  Map,
  Bike,
  Dog,
  Flashlight,
  Droplets,
  Link,
  Shield,
  VolumeX,
  Flag,
  X,
  Check,
  Settings,
  Mountain,
  TreePine,
  Tent,
  Flame,
  ChevronRight,
} from "lucide-react";
import { avatars } from "./profiles";

import { HumanPortrait } from "../world/HumanPortrait";
import { db, useLobby, type Profile, type Visitor } from "./useLobby";
import "./lobby.css";
import "./expedition.css";
import {SIZE, discoveries, type Discovery} from "./exploration";
const LobbyWorld = lazy(() => import("./LobbyWorld"));
const LapaWorld = lazy(() => import("../world/OpenWorld"));
const items = [
  {
    id: "mapa",
    name: "Mapa de campo",
    icon: Map,
    type: "Orientação",
    description:
      "Encontre os pontos do lobby e veja sua posição no mapa de bolso.",
  },
  {
    id: "bicicleta",
    name: "Bicicleta de trilha",
    icon: Bike,
    type: "Mobilidade",
    description:
      "Pedale a até 14 m/s: rodas e postura de ciclismo animadas. Nas cavernas, siga a pé.",
  },
  {
    id: "pet",
    name: "Companheiro de aventura",
    icon: Dog,
    type: "Companhia",
    description:
      "Um cachorrinho que segue seus passos. Use o botão no mapa para brincar com ele.",
  },
  {
    id: "lanterna",
    name: "Lanterna de campo",
    icon: Flashlight,
    type: "Equipamento",
    description:
      "Uma lanterna de mão com um feixe de luz que ilumina o cenário à sua frente.",
  },
  {
    id: "cantil",
    name: "Cantil de caminhada",
    icon: Droplets,
    type: "Equipamento",
    description:
      "Beba para recuperar hidratação. Encha o cantil na base ou em fontes naturais e ferva água não tratada antes de beber.",
  },
  {
    id: "corda",
    name: "Corda de pioneirias",
    icon: Link,
    type: "Equipamento",
    description:
      "Fixe a corda nos pontos de ancoragem para atravessar a ravina com segurança.",
  },  {id:'bussola',name:'Bússola de exploração',icon:Compass,type:'Orientação',description:'Mostra o rumo, a distância e a direção da descoberta mais próxima.'},
  {id:'binoculos',name:'Binóculos',icon:Map,type:'Observação',description:'Use Observar para ampliar a visão distante em primeira pessoa.'},
  {id:'botas',name:'Botas de trilha',icon:Mountain,type:'Mobilidade',description:'Caminhe mais rápido e perca menos velocidade nas subidas.'},
  {id:'capacete',name:'Capacete com luz',icon:Flashlight,type:'Exploração',description:'Ilumine as galerias com uma luz frontal mais ampla. Ligue e desligue pelo botão ou F.'},

];
function savedProfile(): Profile {
  try {
    const p = JSON.parse(
      localStorage.getItem("trilha-lobby-profile") || "null",
    );
    if (
      p &&
      typeof p.nickname === "string" &&
      avatars.some((a) => a.id === p.avatar)
    )
      return {
        nickname: p.nickname,
        avatar: p.avatar,
        club: typeof p.club === "string" ? p.club : "",
      };
  } catch {}
  return { nickname: "", avatar: "trilheiro", club: "" };
}
export default function LobbyApp() {
  const [clubOpen,setClubOpen]=useState(false);
  const [clubDirectory,setClubDirectory]=useState<{clubs:typeof import('../realClubs').realClubs;cities:string[]}>({clubs:[],cities:['LAPA']});
  useEffect(()=>{if(clubOpen&&!clubDirectory.clubs.length)import('../realClubs').then(d=>setClubDirectory({clubs:d.realClubs,cities:d.paranaCities})).catch(()=>{})},[clubOpen,clubDirectory.clubs.length]);
  const [profile, setProfile] = useState<Profile>(savedProfile),
    [draft, setDraft] = useState<Profile>(savedProfile);
  const lobby = useLobby(profile);
  const lastPosition=useRef({room:"",x:0,z:8});
  const [page, setPage] = useState<"world" | "chat" | "kit" | "admin" | "collection">(
      "world",
    ),
    [editing, setEditing] = useState(false),
    [ready, setReady] = useState(false);
  const [item, setItem] = useState("mapa"),
    [gesture, setGesture] = useState(""),
    [selected, setSelected] = useState<Visitor | null>(null);
  const [text, setText] = useState(""),
    [notice, setNotice] = useState(""),
    [muted, setMuted] = useState<string[]>([]),
    [city, setCity] = useState("LAPA");
  const [filter, setFilter] = useState(
      () => new URLSearchParams(location.search).get("server") || "",
    ),
    [lapaPreview, setLapaPreview] = useState(false),
    [lapaPosition, setLapaPosition] = useState({ x: 47, y: 50.83 });
  const [email, setEmail] = useState(""),
    [otp, setOtp] = useState(""),
    [otpSent, setOtpSent] = useState(false),
    [adminLogin, setAdminLogin] = useState(false);
  const [collection, setCollection] = useState<{owner:string; ids:string[]}>({owner:'',ids:[]});
  const foundIds=collection.owner===lobby.userId?collection.ids:[];
  useEffect(()=>{
    const owner=lobby.userId;
    if(!owner)return;
    let ids:string[]=[];
    try{const saved=JSON.parse(localStorage.getItem(`trilha-discoveries-v1:${owner}`)||'[]');if(Array.isArray(saved))ids=discoveries.filter(r=>saved.includes(r.id)).map(r=>r.id)}catch{}
    setCollection({owner,ids});
  },[lobby.userId]);
  function discover(reward:Discovery){
    if(!lobby.userId)return;
    setCollection(previous=>{
      const ids=previous.owner===lobby.userId?previous.ids:[];
      if(ids.includes(reward.id))return previous;
      const next=[...ids,reward.id];
      try{localStorage.setItem(`trilha-discoveries-v1:${lobby.userId}`,JSON.stringify(next))}catch{}
      return {owner:lobby.userId,ids:next};
    });
    setNotice(`Descoberta guardada: ${reward.name}. Veja sua coleção!`);
  }
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem("trilha-lobby-profile", JSON.stringify(profile));
    } catch {}
  }, [profile]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [lobby.messages.length]);
  useEffect(() => {
    if (!selected && !adminLogin) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".camp-overlay .person-dialog");
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), input, select, [tabindex='0']") ?? []);
    controls()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelected(null); setAdminLogin(false); }
      if (event.key !== "Tab") return;
      const nodes = controls(), first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); previous?.focus(); };
  }, [selected?.id, adminLogin]);
  const visible = lobby.visitors.filter((p) => !muted.includes(p.id));
  async function submitProfile(e: FormEvent) {
    e.preventDefault();
    const nickname = draft.nickname.trim();
    if (
      nickname.length < 3 ||
      nickname.length > 18 ||
      /(@|https?:|[0-9]{7,})/i.test(nickname)
    ) {
      setNotice(
        "Escolha um apelido de 3 a 18 caracteres, sem contato pessoal.",
      );
      return;
    }
    setProfile({ ...draft, nickname });
    setReady(true);
    setEditing(false);
    await lobby.start();
    if (lobby.room) await lobby.join(lobby.room);
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await lobby.say(text.trim());
      setText("");
    } catch (err) {
      setNotice((err as Error).message);
    }
  }
  function act(value: string) {
    setGesture(value);
    lobby.gesture(value);
    setTimeout(() => setGesture(""), 5000);
  }
  async function report(p: Visitor) {
    const { error } = await db!.rpc("lobby_report", {
      target_id: p.id,
      reason_text: "Solicito revisão da interação deste jogador no lobby.",
    });
    setNotice(
      error ? error.message : "Denúncia enviada para revisão da administração.",
    );
    setSelected(null);
  }
  async function adminSignIn(e: FormEvent) {
    e.preventDefault();
    if (!db) return;
    if (!otpSent) {
      const { error } = await db.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: location.origin },
      });
      if (error) {
        setNotice(error.message);
        return;
      }
      setOtpSent(true);
      setNotice("Abra o link de acesso recebido por e-mail. Se recebeu um código, você também pode digitá-lo abaixo.");
    } else {
      const { error } = await db.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) {
        setNotice("Código inválido ou expirado.");
        return;
      }
      setAdminLogin(false);
      await lobby.start();
    }
  }
  const nav = [
    { id: "world" as const, label: "Explorar", icon: Compass },
    { id: "chat" as const, label: "Conversa", icon: MessageCircle },
    { id: "collection" as const, label: "Descobertas", icon: Award },
    { id: "kit" as const, label: "Equipamentos", icon: Backpack },
  ];
  return (
    <div className={`camp-app expedition-app ${ready&&lobby.room?"in-server":""} ${page==="world"?"on-world":""}`}>
      <aside className="camp-sidebar">
        <a
          href="#lobby"
          aria-label="Trilha · voltar à exploração"
          className="camp-brand"
          onClick={(e) => {
            e.preventDefault();
            setPage("world");
          }}
        >
          <span>
            <Compass size={25} />
          </span>
          <b>trilha.</b>
        </a>
        <p className="brand-description">A aventura é encontrar.</p>
        <nav aria-label="Navegação principal">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
          {lobby.admin && (
            <button
              className={page === "admin" ? "active" : ""}
              onClick={() => setPage("admin")}
            >
              <Settings size={19} />
              Administração
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-landscape">
            <TreePine />
            <Mountain size={38} />
            <TreePine />
          </div>
          <p>
            Deixe boas histórias
            <br />
            por onde passar.
          </p>
          <button
            className="profile-link"
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
          >
            <span className="portrait">
              <HumanPortrait avatar={profile.avatar} />
            </span>
            <span>
              <b>{profile.nickname || "Seu explorador"}</b>
              <small>{profile.club || "Clube não informado"}</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <button className="admin-entry" onClick={() => setAdminLogin(true)}>
            <Shield size={12} /> Acesso da administração
          </button>
        </div>
      </aside>
      <main className="camp-main">
        <header className="camp-header">
          <div className="mobile-camp-brand">
            <Compass size={20} />
            <b>trilha.</b>
          </div>
          <div className="server-breadcrumb">
            <TreePine size={17} />
            <span>Acampamento Trilha</span>
            {lobby.room && (
              <>
                <ChevronRight size={14} />
                <b>{lobby.room.name}</b>
              </>
            )}
          </div>
          <div className="header-status">
            <button className="mobile-only" aria-label="Editar meu perfil" onClick={() => { setDraft(profile); setEditing(true); }}><Users size={16}/></button>
            <button className="mobile-only" aria-label="Administração" onClick={() => lobby.admin ? setPage("admin") : setAdminLogin(true)}><Shield size={16}/></button>
            <i className={lobby.connected ? "online" : ""} />
            <span>
              {lobby.room
                ? lobby.connected
                  ? "Conectado"
                  : "Conectando…"
                : "Encontre sua turma"}
            </span>
            {lobby.room && (
              <button onClick={() => void lobby.leave()}>
                <LogOut size={15} />
                <span>Trocar servidor</span>
              </button>
            )}
          </div>
        </header>
        <div className="camp-content">
          {!ready || editing ? (
            <section className="arrival">
              <div className="arrival-copy">
                <Compass size={36} />
                <h1>
                  As melhores aventuras
                  <br />
                  começam com um encontro.
                </h1>
                <p>
                  Um acampamento para explorar, fazer amizades e levar o
                  espírito dos Desbravadores para perto. Escolha seu jeito de
                  chegar.
                </p>
                <div className="arrival-spaces">
                  <span>
                    <Flame size={19} />
                    Fogueira e histórias
                  </span>
                  <span>
                    <Tent size={19} />
                    Vida de acampamento
                  </span>
                  <span>
                    <Users size={19} />
                    Jogadores reais
                  </span>
                </div>
              </div>
              <form className="arrival-form" onSubmit={submitProfile}>
                <h2>Seu lugar na roda.</h2>
                <p>
                  Use um apelido. Seu clube serve apenas para identificação.
                </p>
                <label htmlFor="nickname">Como podemos chamar você?</label>
                <input
                  id="nickname"
                  placeholder="Ex.: VentoNorte"
                  minLength={3}
                  maxLength={18}
                  value={draft.nickname}
                  onChange={(e) =>
                    setDraft({ ...draft, nickname: e.target.value })
                  }
                  required
                  autoComplete="off"
                />
                <fieldset>
                  <legend>Escolha seu personagem</legend>
                  <div className="character-picker">
                    {avatars.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        aria-pressed={draft.avatar === a.id}
                        className={draft.avatar === a.id ? "selected" : ""}
                        onClick={() => setDraft({ ...draft, avatar: a.id })}
                      >
                        <HumanPortrait avatar={a.id} />
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <details className="club-details" onToggle={e=>setClubOpen(e.currentTarget.open)}>
                  <summary>
                    {draft.club || "Identificar meu clube (opcional)"}
                  </summary>
                  <label htmlFor="city">Cidade do Paraná</label>
                  <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {clubDirectory.cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <label htmlFor="club">Clube</label>
                  <select
                    id="club"
                    value={draft.club}
                    onChange={(e) =>
                      setDraft({ ...draft, club: e.target.value })
                    }
                  >
                    <option value="">Sem clube informado</option>
                    {clubDirectory.clubs
                      .filter((c) => c.city === city)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <small>O clube não altera a sala ou seu acesso.</small>
                </details>
                <button
                  type="submit"
                  className="camp-primary"
                  disabled={lobby.busy}
                >
                  {lobby.busy
                    ? "Preparando sua entrada…"
                    : "Escolher meu servidor"}
                  <ArrowRight size={17} />
                </button>
                {editing && (
                  <button
                    type="button"
                    className="camp-text-button"
                    onClick={() => setEditing(false)}
                  >
                    Voltar
                  </button>
                )}
                <small className="profile-note">
                  <Shield size={13} />
                  Seu apelido e clube serão visíveis para a sala. Evite dados
                  pessoais.
                </small>
              </form>
            </section>
          ) : !lobby.room ? (
            <section className="servers-page">
              <div className="page-title">
                <div>
                  <h1>Onde a turma se encontra.</h1>
                  <p>
                    Escolha um servidor ou combine o mesmo nome com seus amigos.
                  </p>
                </div>
                <button
                  className="camp-secondary"
                  disabled={lobby.busy}
                  onClick={() => void lobby.start()}
                >
                  <RefreshCw size={16} />
                  Atualizar
                </button>
              </div>
              <div className="server-filter">
                <Users size={18} />
                <input
                  aria-label="Buscar servidor"
                  placeholder="Procurar pelo nome do servidor…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <p className="server-feedback" role="status">{lobby.status}</p><div className="server-grid">
                {lobby.servers
                  .filter(
                    (s) =>
                      s.name.toLowerCase().includes(filter.toLowerCase()) ||
                      s.id.includes(filter.toLowerCase()),
                  )
                  .map((s, i) => (
                    <article className="server-tile" key={s.id}>
                      <div className={`server-art art-${i % 4}`}>
                        <Mountain size={90} />
                        <TreePine className="server-pine" size={45} />
                        <span className="server-code">
                          {s.id.toUpperCase()}
                        </span>
                      </div>
                      <div className="server-copy">
                        <div>
                          <h2>{s.name}</h2>
                          <span className="server-availability">
                            <i />
                            {s.online >= s.capacity ? "Lotado" : "Disponível"}
                          </span>
                        </div>
                        <p>Acampamento compartilhado · Brasil</p>
                        <div className="occupancy">
                          <span
                            style={{
                              width: `${Math.min(100, (s.online / s.capacity) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="server-bottom">
                          <span>
                            <Users size={15} />
                            {s.online} / {s.capacity} jogadores
                          </span>
                          <button
                            disabled={lobby.busy || s.online >= s.capacity}
                            onClick={() => void lobby.join(s)}
                          >
                            Entrar
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
              {!lobby.servers.length && (
                <div className="server-empty">
                  <Compass size={28} />
                  <p>{lobby.status}</p>
                  <button
                    className="camp-primary"
                    onClick={() => void lobby.start()}
                    disabled={lobby.busy}
                  >
                    Tentar conexão novamente
                  </button>
                </div>
              )}
              <div className="server-explanation">
                <Shield size={18} />
                <p>
                  Você vê e conversa com quem escolheu o mesmo servidor. Os
                  espaços são iguais; as histórias são diferentes. Sem
                  personagens simulados.
                </p>
              </div>
            </section>
          ) : (
            <>
              <div className="page-title">
                <div>
                  <h1>
                    {page === "world"
                      ? `Chegue mais, ${profile.nickname}.`
                      : page === "chat"
                        ? "Uma boa conversa vai longe."
                        : page === "collection" ? "Toda trilha guarda uma descoberta." : page === "kit"
                          ? "Pronto para a próxima aventura."
                            : "Cuide do acampamento."}
                  </h1>
                  <p>
                    {page === "world"
                      ? "A fogueira está acesa. Sua próxima amizade pode estar logo ali."
                      : page === "chat"
                        ? `Conversa do servidor ${lobby.room.name}.`
                        : page === "collection" ? "Explore, encontre e guarde lembranças da sua aventura." : page === "kit"
                          ? "Equipamentos que fazem parte da vida de campo."
                            : "Acesso restrito aos administradores cadastrados."}
                  </p>
                </div>
                <div className="room-pill">
                  <Users size={16} />
                  {visible.length + 1} na sala<span>·</span>
                  {lobby.room.name}
                </div>
              </div>
              {!lobby.connected && (
                <div className="connection-notice" role="status">
                  {lobby.status}
                </div>
              )}
              {(<div className="world-panel" hidden={page!=="world"}>
                <div className="lobby-layout">
                  <div className="world-column">
                    <Suspense
                      fallback={
                        <div className="loading-world">
                          Preparando seu acampamento…
                        </div>
                      }
                    >
                      {lapaPreview && (lobby.admin || lobby.lapa) ? (
                        <>
                          <button
                            className="camp-secondary"
                            onClick={() => setLapaPreview(false)}
                          >
                            Voltar ao lobby
                          </button>
                          <LapaWorld
                            avatar={profile.avatar}
                            nickname={profile.nickname}
                            position={lapaPosition}
                            paused={false}
                            players={[]}
                            rewards={[]}
                            claimedIds={[]}
                            onPosition={setLapaPosition}
                            onReward={() => {}}
                          />
                        </>
                      ) : (
                        <LobbyWorld
                          key={lobby.room.id}
                          initialPosition={lastPosition.current.room===lobby.room.id?lastPosition.current:undefined}
                          foundIds={foundIds}
                          onDiscover={discover}
                          profile={profile}
                          players={visible}
                          item={item}
                          onEquip={setItem}
                          gesture={gesture}
                          paused={!!selected||page!=="world"}
                          onMove={(x, y, visualItem) => {lastPosition.current={room:lobby.room!.id,x:(x-50)*SIZE/100,z:(y-50)*SIZE/100};lobby.move(x,y,visualItem??item)}}
                          onPlayer={setSelected}
                        />
                      )}
                    </Suspense>
                    <div className="world-bottom-bar">
                      <div className="gesture-actions">
                        {["Acenar", "Celebrar", "Sentar"].map((g) => (
                          <button
                            key={g}
                            className={gesture === g ? "selected" : ""}
                            onClick={() => act(g)}
                          >
                            <Hand size={15} />
                            {g}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setPage("kit")}>
                        <Backpack size={17} />
                        {items.find((i) => i.id === item)?.name ||
                          "Equipar item"}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    {lobby.lapa && (
                      <button
                        className="camp-secondary"
                        onClick={() => setLapaPreview(true)}
                      >
                        Visitar Lapa · liberado pela administração
                      </button>
                    )}
                    <div className="camp-field-note">
                      <TreePine size={17} />
                      <span>
                        Trilhas conectadas, cavernas nas encostas e descobertas para sua coleção.
                      </span>
                    </div>
                  </div>
                  <aside className="people-rail">
                    <div className="people-header">
                      <h2>Quem está aqui</h2>
                      <span>{visible.length + 1}</span>
                    </div>
                    <div className="my-person">
                      <span className="portrait">
                        <HumanPortrait avatar={profile.avatar} />
                      </span>
                      <div>
                        <b>
                          {profile.nickname}
                          <small> você</small>
                        </b>
                        <span>{profile.club || "Clube não informado"}</span>
                      </div>
                      <i />
                    </div>
                    {visible.length === 0 ? (
                      <div className="people-empty">
                        <Users size={31} />
                        <h3>Você chegou primeiro.</h3>
                        <p>
                          Convide sua turma para o servidor{" "}
                          <b>{lobby.room.name}</b>. Quem entrar aqui aparecerá
                          no mapa.
                        </p>
                        <button
                          className="camp-secondary"
                          onClick={() => {
                            void navigator.clipboard
                              .writeText(
                                `https://trilha-campori.vercel.app/?server=${lobby.room!.id}`,
                              )
                              .then(() =>
                                setNotice("Link do servidor copiado."),
                              )
                              .catch(() =>
                                setNotice(`Servidor: ${lobby.room!.name}`),
                              );
                          }}
                        >
                          Copiar convite
                        </button>
                      </div>
                    ) : (
                      visible.map((p) => (
                        <button
                          className="person-row"
                          key={p.id}
                          onClick={() => setSelected(p)}
                        >
                          <span className="portrait">
                            <HumanPortrait avatar={p.avatar} />
                          </span>
                          <span>
                            <b>{p.nickname}</b>
                            <small>{p.club || "Clube não informado"}</small>
                            {p.gesture && <em>{p.gesture}</em>}
                          </span>
                          <i />
                        </button>
                      ))
                    )}
                    <div className="rail-conversation">
                      <MessageCircle size={20} />
                      <h3>Encontre uma boa história.</h3>
                      <p>A conversa é compartilhada com este servidor.</p>
                      <button
                        className="camp-primary"
                        onClick={() => setPage("chat")}
                      >
                        Abrir conversa
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </aside>
                </div>
              </div>)}
              {page === "collection" && <section className="collection-panel"><div className="collection-summary"><Award size={32}/><div><h2>{foundIds.length} de {discoveries.length} descobertas</h2><p>Procure os cristais pelo mapa. Aproxime-se e pressione E ou toque em Recolher.</p></div><button className="camp-primary" onClick={()=>setPage('world')}>Continuar explorando <ArrowRight size={16}/></button></div><progress value={foundIds.length} max={discoveries.length} aria-label="Progresso das descobertas"/><p className="collection-storage">Coleção de lembranças salva neste navegador para sua identidade atual. Não gera moedas.</p><div className="discovery-grid">{discoveries.map((r,index)=>{const found=foundIds.includes(r.id);return <article key={r.id} className={found?'discovery found':'discovery'}><span className="discovery-number">{String(index+1).padStart(2,'0')} · {r.rarity}</span><Award size={32}/><h3>{found?r.name:'Ainda por descobrir'}</h3><p>{found?r.story:r.hint}</p><b>{found?'Na sua coleção':'Siga a pista'}</b></article>})}</div></section>}
              {page === "chat" && (
                <section className="camp-chat">
                  <div className="chat-room-title">
                    <MessageCircle size={22} />
                    <div>
                      <h2>{lobby.room.name}</h2>
                      <span>{visible.length + 1} jogadores na sala</span>
                    </div>
                  </div>
                  <p className="chat-safety">
                    <Shield size={15} />
                    Cuide de quem está do outro lado. Não compartilhe dados
                    pessoais.
                  </p>
                  <div
                    className="camp-messages"
                    role="log"
                    aria-label="Mensagens do servidor"
                  >
                    {lobby.messages
                      .filter((m) => !muted.includes(m.user_id))
                      .map((m) => (
                        <article
                          key={m.id}
                          className={
                            m.user_id === lobby.userId ? "my-message" : ""
                          }
                        >
                          <span className="portrait">
                            <HumanPortrait avatar={m.avatar} />
                          </span>
                          <div>
                            <b>{m.nickname}</b>
                            <time>
                              {new Date(m.created_at).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </time>
                            <p>{m.body}</p>
                          </div>
                        </article>
                      ))}
                    {!lobby.messages.length && (
                      <div className="chat-empty">
                        <MessageCircle size={34} />
                        <p>
                          A primeira história pode ser sua.
                          <br />
                          Diga um olá para a turma.
                        </p>
                      </div>
                    )}
                    <div ref={bottom} />
                  </div>
                  <form className="camp-composer" onSubmit={send}>
                    <input
                      aria-label="Mensagem para o servidor"
                      placeholder="Escreva para a turma…"
                      value={text}
                      maxLength={160}
                      onChange={(e) => setText(e.target.value)}
                    />
                    <span>{text.length}/160</span>
                    <button
                      aria-label="Enviar mensagem"
                      disabled={!lobby.connected || !text.trim()}
                    >
                      <ArrowRight size={21} />
                    </button>
                  </form>
                  <small>
                    Uma mensagem a cada 8 segundos. A conversa fica neste
                    servidor.
                  </small>
                </section>
              )}
              {page === "kit" && (
                <section className="equipment-page">
                  <div className="kit-intro">
                    <Backpack size={26} />
                    <p>
                      <b>Kit aberto para experimentar.</b> Nesta fase, teste os
                      equipamentos gratuitamente no lobby. As compras serão
                      liberadas após a configuração dos pagamentos e dos preços
                      de cada item.
                    </p>
                  </div>
                  <div className="equipment-grid">
                    {items.map(
                      ({ id, name, icon: Icon, type, description }) => (
                        <article className="equipment-item" key={id}>
                          <div className={`equipment-art equipment-${id}`}>
                            <Icon size={68} strokeWidth={1.2} />
                            <span>{type}</span>
                          </div>
                          <div>
                            <h2>{name}</h2>
                            <p>{description}</p>
                            <button
                              className={
                                item === id ? "camp-secondary" : "camp-primary"
                              }
                              onClick={() => {
                                setItem(item === id ? "" : id);
                                setPage("world");
                                setNotice(
                                  item === id
                                    ? "Item guardado."
                                    : `${name} equipado. Volte ao lobby para usar.`,
                                );
                              }}
                            >
                              {item === id ? (
                                <>
                                  <Check size={16} />
                                  Equipado · guardar
                                </>
                              ) : (
                                <>
                                  Experimentar no lobby
                                  <ArrowRight size={15} />
                                </>
                              )}
                            </button>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                </section>
              )}
              {page === "admin" && lobby.admin && (
                <section className="camp-admin">
                  <Shield size={30} />
                  <h2>Mapa da Lapa preservado</h2>
                  <p>
                    O cenário original foi mantido separado do lobby. Inspecione
                    e libere o acesso quando houver uma atividade.
                  </p>
                  <button
                    className="camp-secondary"
                    onClick={() => {
                      setLapaPreview(true);
                      setPage("world");
                    }}
                  >
                    Inspecionar Lapa
                  </button>
                  <button
                    className="camp-primary"
                    onClick={async () => {
                      const { error } = await db!.rpc("lobby_set_lapa", {
                        is_enabled: !lobby.lapa,
                      });
                      if (error) setNotice(error.message);
                      else {
                        setNotice("Configuração atualizada.");
                        await lobby.start();
                      }
                    }}
                  >
                    {lobby.lapa
                      ? "Recolher acesso público à Lapa"
                      : "Liberar Lapa para os jogadores"}
                  </button>
                </section>
              )}
            </>
          )}
        </div>
        <footer className="camp-footer">
          <Compass size={14} />
          Trilha · um encontro de cada vez.
          <span>Seu clube é sua identificação, sua turma é de todo lugar.</span>
        </footer>
      </main>
      <nav className="camp-mobile-nav" aria-label="Navegação no celular">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => setPage(id)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {selected && (
        <div
          className="camp-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section
            className="person-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="person-title"
          >
            <button
              className="dialog-close"
              onClick={() => setSelected(null)}
              aria-label="Fechar perfil"
            >
              <X size={20} />
            </button>
            <span className="portrait large">
              <HumanPortrait avatar={selected.avatar} />
            </span>
            <h2 id="person-title">{selected.nickname}</h2>
            <p>{selected.club || "Clube não informado"}</p>
            <button
              className="camp-primary"
              onClick={() => {
                act("Acenar");
                setSelected(null);
              }}
            >
              <Hand size={17} />
              Acenar para {selected.nickname}
            </button>
            <button
              className="camp-secondary"
              onClick={() => {
                setPage("chat");
                setText(`Olá, ${selected.nickname}! `);
                setSelected(null);
              }}
            >
              <MessageCircle size={17} />
              Conversar no servidor
            </button>
            <button
              className="camp-text-button"
              onClick={() => {
                setMuted([...muted, selected.id]);
                setSelected(null);
                setNotice("Jogador silenciado nesta sessão.");
              }}
            >
              <VolumeX size={16} />
              Silenciar nesta sessão
            </button>
            <button
              className="camp-text-button"
              onClick={() => void report(selected)}
            >
              <Flag size={16} />
              Enviar denúncia à administração
            </button>
          </section>
        </div>
      )}
      {adminLogin && (
        <div className="camp-overlay">
          <form className="person-dialog" onSubmit={adminSignIn} role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <button
              type="button"
              className="dialog-close"
              onClick={() => setAdminLogin(false)}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <Shield size={30} />
            <h2 id="admin-title">Acesso da administração</h2>
            <p>
              Use o e-mail previamente cadastrado como administrador. Entrar por
              e-mail não concede privilégios.
            </p>
            <label htmlFor="admin-email">E-mail</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {otpSent && (
              <>
                <p>Abra o link recebido para entrar. Ao voltar ao Trilha, escolha seu servidor para acessar a administração. Se o e-mail trouxer um código, você pode usá-lo abaixo.</p>
                <label htmlFor="admin-code">Código, se recebido no e-mail</label>
                <input
                  id="admin-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </>
            )}
            <button className="camp-primary">
              {otpSent ? "Verificar código" : "Enviar acesso por e-mail"}
            </button>
          </form>
        </div>
      )}
      {notice && (
        <div className="camp-toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

