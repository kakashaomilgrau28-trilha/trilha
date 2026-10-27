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
- VIP access costs BRL 14.90 once, without automatic renewal. The owner explicitly deferred payment setup on 19 October 2026. Do not enable sales until identity recovery, checkout and verified webhook fulfillment are configured.
- Expected peak: up to 20,000 concurrent people. This is a planning target, not a validated capacity claim. Use multiple servers, not one scene with 20,000 characters.
- Map-only fullscreen, desktop keyboard controls and touch controls.

## Stack and existing identity
Retain React 18, Vite, TypeScript, Three.js, Supabase, GitHub and Vercel from the existing project. Preserve the Trilha name, forest palette, cream surfaces and approachable Portuguese language.

## Constraints and current limits
The current realtime implementation targets a small pilot. It uses private Supabase channels, membership checks, server-controlled chat and room capacity. Movement and gestures are ephemeral client-reported cosmetic state; never use them to authorize rewards, purchases or VIP. Full load and mobile hardware performance remain unverified. Administration requires a verified owner email; no localStorage admin/VIP bypass.

## Exploration expansion — 20 October 2026
The walkable square now covers 150 times the original area: exactly 10 times the previous 15x version, with each side multiplied by sqrt(10). Its playable sides measure approximately 931 m. The central camp stays at its original size. Ten trails lead to ten exterior destinations including two covered caves, dense woodland and a rope crossing. Sixteen one-time cosmetic discoveries form a scrapbook. The topographic location map derives terrain heights, forest positions, trail curves, water, cave plans and destinations from the same data used by the 3D scene; it supports panning, zoom, heading, a scale and centering on the player. It represents the fictional camp, not geographic Lapa.

Cycling has a mounted pose, rolling wheels and faster movement; caves are explored on foot. Energy drains when running/cycling and recovers at rest. The canteen has three refillable doses that restore energy; rope crosses the marked ravine; compass points toward uncollected discoveries; binoculars zoom in first person; boots improve walking and slope speed; flashlight/headlamp illuminate dark cave galleries. The pet signals nearby discoveries. Equipment is client-side trial gameplay, not purchased entitlement. Collection remains localStorage per authenticated identity in this browser. Energy and water last for the current 3D session. Returning from equipment or collection preserves position within the current room until reload.

## Expedition redesign — 27 October 2026
The user authorized a full redesign, naming Project Zomboid as the primary reference, and specifically rejected caves that looked like disconnected square blocks. The game now uses a rotatable isometric orthographic view, dark olive equipment UI, ten quick slots (1–0), waypoint marking and persistent scene/resources while navigating menus. The two caves use irregular galleries, rock entrances, hillside cover and interior cutaway. Both entrance approaches, the mountain link and the cascade/creek watercourse share their data with the atlas. Preserve all sixteen discovery IDs and current room/admin/VIP rules. Local geometry tests do not establish server authority or load capacity.
