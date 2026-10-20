import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
const url = "https://yphomgvxamhhetlxxkza.supabase.co",
  key = "sb_publishable_zT4kkjegJRyrfIqUt0REgg_AMxQPgWL";
const a = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  b = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const sign = async (c) => {
  const r = await c.auth.signInAnonymously();
  assert.ifError(r.error);
  return r.data.user.id;
};
const aid = await sign(a),
  bid = await sign(b);
const rpc = async (c, name, args) => {
  const r = await c.rpc(name, args);
  assert.ifError(r.error);
  return r.data;
};
try {
  const servers = await rpc(a, "lobby_server_list");
  assert.equal(servers.length, 8);
  await rpc(a, "lobby_join", {
    room_id: "araucaria",
    display_name: "QAExplorador",
    avatar_id: "trilheiro",
    club_name: "Clube de teste",
  });
  await rpc(b, "lobby_join", {
    room_id: "fogueira",
    display_name: "QACompanheiro",
    avatar_id: "guardiao",
    club_name: "",
  });
  const read = await b.from("lobby_members").select("user_id");
  assert(!read.data.some((p) => p.user_id === aid));
  await rpc(b, "lobby_join", {
    room_id: "araucaria",
    display_name: "QACompanheiro",
    avatar_id: "guardiao",
    club_name: "",
  });
  const same = await a.from("lobby_members").select("user_id");
  assert(same.data.some((p) => p.user_id === bid));
  const failAdmin = await a.rpc("lobby_set_lapa", { is_enabled: true });
  assert(failAdmin.error);
  const vip = await a
    .from("lobby_entitlements")
    .insert({ user_id: aid, vip: true });
  assert(vip.error);
  const vipJoin = await a.rpc("lobby_join", {room_id:"vip-araucaria",display_name:"QAExplorador",avatar_id:"trilheiro",club_name:""});
  assert(vipJoin.error);
  const message = "Teste de integração do acampamento";
  await rpc(a, "lobby_say", { message });
  const chat = await b.from("lobby_messages").select("*").eq("body", message).eq("user_id",aid);
  assert.equal(chat.data.length, 1);
  assert(
    (await a.rpc("lobby_say", { message: "Mensagem repetida rápida" })).error,
  );
  const presence = [];
  const ch = b.channel("lobby:araucaria", {
    config: { private: true, presence: { key: bid } },
  });
  ch.on("presence", { event: "sync" }, () => presence.push(ch.presenceState()));
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Presence timeout")),
      15000,
    );
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ x: 50, y: 57 });
        clearTimeout(timeout);
        resolve();
      } else if (status === "CHANNEL_ERROR") {
        clearTimeout(timeout);
        reject(new Error("Private channel rejected"));
      }
    });
  });
  console.log(
    JSON.stringify({
      result: "PASS",
      servers: servers.length,
      roomIsolation: true,
      sameRoomPlayers: true,
      realChat: true,
      cooldown: true,
      adminDenied: true,
      vipWriteDenied: true,
      vipRoomDenied: true,
      privatePresence: true,
    }),
  );
  await b.removeAllChannels();
} finally {
  await a.rpc("lobby_leave");
  await b.rpc("lobby_leave");
  await a.removeAllChannels();
  await b.removeAllChannels();
}
process.exit(0);
