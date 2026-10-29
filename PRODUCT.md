# Trilha

## Platform
Web, including mobile browsers. Portuguese interface.

## Purpose and audience
A shared virtual camp for Desbravadores to meet, walk, chat and interact through detailed characters and field equipment.

## Confirmed product decisions
- Entry through a central camp lobby in an expanded explorable region, with selectable named servers and separate conversations.
- Players see real connected visitors on their chosen server. Club membership is optional identification only.
- Preserve Lapa as a separate, initially closed map; only the administrator can release it.
- Field map, bicycle, interactive pet, flashlight, canteen, rope, compass, binoculars, hiking boots and headlamp are useful equipment. During payment setup they are explicitly free trials, not paid purchases.
- The owner removed VIP on 28 October 2026. No reserved area, membership page, price or VIP access action remains in the game. Legacy private servers are disabled; do not reintroduce this feature without a new request.
- Expected peak: up to 20,000 concurrent people. This is a planning target, not a validated capacity claim. Use multiple servers, not one scene with 20,000 characters.
- Map-only fullscreen, desktop keyboard controls and touch controls.

## Stack and existing identity
Retain React 18, Vite, TypeScript, Three.js, Supabase, GitHub and Vercel from the existing project. Preserve the Trilha name, forest palette, cream surfaces and approachable Portuguese language.

## Constraints and current limits
The current realtime implementation targets a small pilot. It uses private Supabase channels, membership checks, server-controlled chat and room capacity. Movement and gestures are ephemeral client-reported cosmetic state; never use them to authorize rewards or purchases. Full load and mobile hardware performance remain unverified. Administration requires a verified owner email; no localStorage admin bypass.

## Exploration expansion — 20 October 2026
The walkable square now covers 150 times the original area: exactly 10 times the previous 15x version, with each side multiplied by sqrt(10). Its playable sides measure approximately 931 m. The central camp stays at its original size. Ten trails lead to ten exterior destinations including two covered caves, dense woodland and a rope crossing. Sixteen one-time cosmetic discoveries form a scrapbook. The topographic location map derives terrain heights, forest positions, trail curves, water, cave plans and destinations from the same data used by the 3D scene; it supports panning, zoom, heading, a scale and centering on the player. It represents the fictional camp, not geographic Lapa.

Cycling has a mounted pose, rolling wheels and faster movement; caves are explored on foot. Energy drains when running/cycling and recovers at rest. The canteen has three refillable doses that restore hydration (not stamina); rope crosses the marked ravine; compass points toward uncollected discoveries; binoculars zoom in first person; boots improve walking and slope speed; flashlight/headlamp illuminate dark cave galleries. The pet signals nearby discoveries. Equipment is client-side trial gameplay, not purchased entitlement. Collection remains localStorage per authenticated identity in this browser. Energy and water last for the current 3D session. Returning from equipment or collection preserves position within the current room until reload.

## Expedition redesign — 27 October 2026
The user authorized a full redesign, naming Project Zomboid as the primary reference, and specifically rejected caves that looked like disconnected square blocks. The game now uses a rotatable isometric orthographic view, dark olive equipment UI, ten quick slots (1–0), waypoint marking and persistent scene/resources while navigating menus. The two caves use irregular galleries, rock entrances, intact hillside cover and an approaching interior perspective camera. Both entrance approaches, the mountain link and the cascade/creek watercourse share their data with the atlas. Preserve all sixteen discovery IDs and current room/admin rules. Local geometry tests do not establish server authority or load capacity.

The region now has sixteen connected paths (including camp alleys), a valley circuit, two ridges, a descending watercourse and two cave approaches. Near cover the lens and camera distance interpolate from the isometric frame to proximity; roofs, walls and foliage remain rendered. Physical equipment uses hand/head/foot sockets, an independently moving pet, parked bicycle and timed water actions. Detailed use animations remain local.


## Survival expedition
The user explicitly requested six distinct biomes, punitive survival and real-animal territorial fauna with hunting/fishing, plus 18 missions. This supersedes the earlier no-combat scope only for natural animals; supernatural/zombie content remains excluded. Health, stamina, thirst, hunger, body temperature, wounds, weight, tool durability, weather/day/night/seasons and finite gathering are integrated into the active movement and equipment loop. Fog reveals only explored terrain. The journal supports tasks/rewards, inventory/crafting and field actions. Helena is an identified fictional quest NPC, never a substitute for real connected players. Bicycle remains at its parked location and can no longer be summoned across the map.
Player checkpoints require base/camp presence and explicit save; death explains its cause and resumes the saved checkpoint. World depletion persists separately to avoid immediate resource farming via rollback. New simulation, fauna, inventory and missions are browser-local, while existing player presence/chat remain networked. This is not server-authoritative shared survival or a 20k concurrency validation. See docs/survival-systems.md and check-survival.mjs for exact implemented behavior and evidence boundaries.

## Animation corrections and explorer name — 28 October 2026
The explorer is Milena. Preserve the explorer landmark ID and existing mission progress; legacy checkpoint messages are translated on load. Rope traversal uses an overhead cable with a trolley, a separate hand grip and harness; wrist sockets are constrained to the handle, with clear space above the head. The trailer uses the same rig and movement collision geometry. Its heading and stride derive from actual displacement; stationary shots use idle/emotes. Social trailer claims cover room selection, presence and chat, not synchronized survival or shared animal AI.
