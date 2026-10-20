import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export const db = supabase as SupabaseClient | null;
export type Server = {
  id: string;
  name: string;
  capacity: number;
  online: number;
};
export type Profile = { nickname: string; avatar: string; club: string };
export type Visitor = Profile & {
  id: string;
  x: number;
  y: number;
  gesture: string;
  item: string;
  updated: number;
};
export type Message = {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string;
  body: string;
  created_at: string;
};
export function useLobby(profile: Profile) {
  const [userId, setUserId] = useState(""),
    [servers, setServers] = useState<Server[]>([]);
  const [room, setRoom] = useState<Server | null>(null),
    [visitors, setVisitors] = useState<Visitor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]),
    [status, setStatus] = useState("Escolha seu apelido para entrar."),
    [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false),
    [admin, setAdmin] = useState(false),
    [vip, setVip] = useState(false),
    [lapa, setLapa] = useState(false);
  const channel = useRef<RealtimeChannel | null>(null);
  const position = useRef({
    x: 50,
    y: 57,
    gesture: "",
    item: "",
    updated: Date.now(),
  });
  const liveProfile = useRef(profile);
  liveProfile.current = profile;
  async function refreshServers() {
    if (!db) return;
    const { data, error } = await db.rpc("lobby_server_list");
    if (error)
      throw new Error(
        "Não foi possível consultar os servidores. Tente novamente.",
      );
    setServers(data ?? []);
  }
  async function authenticate() {
    if (!db) throw new Error("A conexão do lobby ainda não foi configurada.");
    let {
      data: { session },
    } = await db.auth.getSession();
    if (!session) {
      const result = await db.auth.signInAnonymously();
      if (result.error)
        throw new Error(
          "Entrada de visitantes indisponível. Tente novamente em instantes.",
        );
      session = result.data.session;
    }
    if (!session) throw new Error("Não foi possível iniciar sua sessão.");
    if (userId && userId !== session.user.id) setRoom(null);
    setUserId(session.user.id);
    await db.rpc("lobby_activate_admin");
    const [a, v, w] = await Promise.all([
      db.from("lobby_admins").select("user_id").eq("user_id", session.user.id),
      db
        .from("lobby_entitlements")
        .select("vip")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      db.from("lobby_worlds").select("id,enabled"),
    ]);
    setAdmin(!!a.data?.length);
    setVip(v.data?.vip === true);
    setLapa(
      !!w.data?.some(
        (r: { id: string; enabled: boolean }) => r.id === "lapa" && r.enabled,
      ),
    );
    await refreshServers();
    return session.user.id;
  }
  async function start() {
    setBusy(true);
    try {
      await authenticate();
      setStatus("Escolha um servidor.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function join(server: Server) {
    setBusy(true);
    try {
      if (!db) throw new Error("Conexão indisponível.");
      if (!userId) await authenticate();
      const p = liveProfile.current;
      const { error } = await db.rpc("lobby_join", {
        room_id: server.id,
        display_name: p.nickname,
        avatar_id: p.avatar,
        club_name: p.club,
      });
      if (error) throw error;
      setRoom(server);
      setMessages([]);
      setVisitors([]);
      position.current = {
        x: 50 + Math.random() * 2 - 1,
        y: 57 + Math.random() * 2 - 1,
        gesture: "",
        item: "",
        updated: Date.now(),
      };
      setStatus("Conectando ao servidor…");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!room || !db || !userId) return;
    const client = db;
    let disposed = false,
      roster = new Map<string, Profile>(),
      lastTrack = "";
    const positions = new Map<string, Record<string, unknown>>();
    const c = client.channel(`lobby:${room.id}`, {
      config: { private: true, presence: { key: userId } },
    });
    channel.current = c;
    const sync = () => {
      if (disposed) return;
      const peers: Visitor[] = [];
      for (const [id, entries] of Object.entries(c.presenceState())) {
        if (id === userId || !roster.has(id)) continue;
        const value =
          positions.get(id) ??
          (entries[entries.length - 1] as unknown as Record<string, unknown>);
        if (
          typeof value.x !== "number" ||
          typeof value.y !== "number" ||
          !Number.isFinite(value.x) ||
          !Number.isFinite(value.y)
        )
          continue;
        peers.push({
          ...roster.get(id)!,
          id,
          x: Math.max(5, Math.min(95, value.x)),
          y: Math.max(5, Math.min(95, value.y)),
          gesture: [
            "Acenar",
            "Celebrar",
            "Sentar",
            "Olá!",
            "Vamos explorar?",
          ].includes(String(value.gesture))
            ? String(value.gesture)
            : "",
          item: [
            "mapa",
            "bicicleta",
            "pet",
            "lanterna",
            "cantil",
            "corda",
            "bussola", "binoculos", "botas", "capacete",
          ].includes(String(value.item))
            ? String(value.item)
            : "",
          updated: Date.now(),
        });
      }
      setVisitors(peers);
    };
    const refreshRoster = async () => {
      const { data, error } = await client
        .from("lobby_members")
        .select("user_id,nickname,avatar,club")
        .eq("server_id", room.id);
      if (!error && data) {
        roster = new Map(
          data.map((p) => [
            p.user_id,
            { nickname: p.nickname, avatar: p.avatar, club: p.club },
          ]),
        );
        sync();
      }
    };
    const readMessages = async () => {
      const { data } = await client
        .from("lobby_messages")
        .select("*")
        .eq("server_id", room.id)
        .order("created_at", { ascending: false })
        .limit(60);
      if (!disposed && data) setMessages(data.reverse());
    };
    c.on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, ({ key }) => {
        if (!roster.has(key)) void refreshRoster();
      })
      .on("presence", { event: "leave" }, sync)
      .on("broadcast", { event: "move" }, ({ payload }) => {
        if (
          !payload ||
          typeof payload.id !== "string" ||
          !roster.has(payload.id) ||
          !c.presenceState()[payload.id]
        )
          return;
        positions.set(payload.id, payload);
        sync();
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lobby_messages",
          filter: `server_id=eq.${room.id}`,
        },
        (payload) => {
          if (disposed) return;
          const m = payload.new as Message;
          setMessages((old) =>
            old.some((v) => v.id === m.id) ? old : [...old.slice(-59), m],
          );
        },
      )
      .subscribe(async (state) => {
        if (disposed) return;
        setConnected(state === "SUBSCRIBED");
        if (state === "SUBSCRIBED") {
          await refreshRoster();
          await c.track({ ...position.current });
          await readMessages();
          setStatus("Conectado");
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT")
          setStatus(
            "Conexão interrompida. Saia e entre novamente no servidor.",
          );
      });
    const movement = window.setInterval(() => {
      if (document.hidden || c.state !== "joined") return;
      const p = position.current,
        key = `${p.x.toFixed(2)}:${p.y.toFixed(2)}:${p.gesture}:${p.item}`;
      if (key !== lastTrack) {
        lastTrack = key;
        void c.send({
          type: "broadcast",
          event: "move",
          payload: { id: userId, ...p },
        });
      }
    }, 500);
    const heartbeat = window.setInterval(async () => {
      const { error } = await client.rpc("lobby_heartbeat");
      if (error && !disposed) {
        setConnected(false);
        setStatus("Sessão interrompida. Entre novamente no servidor.");
        return;
      }
      await refreshRoster();
    }, 20000);
    return () => {
      disposed = true;
      clearInterval(movement);
      clearInterval(heartbeat);
      setConnected(false);
      void client.removeChannel(c);
      channel.current = null;
    };
  }, [room?.id, userId]);
  async function leave() {
    setStatus("Escolha um servidor.");
    setRoom(null);
    setVisitors([]);
    setConnected(false);
    await db?.rpc("lobby_leave");
    try {
      await refreshServers();
    } catch {}
  }
  async function say(body: string) {
    if (!db || !connected) throw new Error("Aguarde a conexão com o servidor.");
    const { error } = await db.rpc("lobby_say", { message: body });
    if (error) throw error;
  }
  function move(x: number, y: number, item: string) {
    position.current = { ...position.current, x, y, item, updated: Date.now() };
  }
  function gesture(value: string) {
    position.current = {
      ...position.current,
      gesture: value,
      updated: Date.now(),
    };
    window.setTimeout(() => {
      if (position.current.gesture === value) position.current.gesture = "";
    }, 5000);
  }
  return {
    userId,
    servers,
    room,
    visitors,
    messages,
    status,
    busy,
    connected,
    admin,
    vip,
    lapa,
    start,
    join,
    leave,
    say,
    move,
    gesture,
    refreshServers,
  };
}
