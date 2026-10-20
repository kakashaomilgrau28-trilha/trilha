# Trilha

## Platform
Web, including mobile browsers. Portuguese interface.

## Purpose and audience
A shared virtual camp for Desbravadores to meet, walk, chat and interact through detailed characters and field equipment.

## Confirmed product decisions
- Entry through a compact camp lobby, with selectable named servers and separate conversations.
- Players see real connected visitors on their chosen server. Club membership is optional identification only.
- Preserve Lapa as a separate, initially closed map; only the administrator can release it.
- Field map, bicycle, interactive pet, flashlight, canteen and rope are useful equipment. During payment setup they are explicitly free trials, not paid purchases.
- VIP access costs BRL 14.90 once, without automatic renewal. The owner explicitly deferred payment setup on 19 October 2026. Do not enable sales until identity recovery, checkout and verified webhook fulfillment are configured.
- Expected peak: up to 20,000 concurrent people. This is a planning target, not a validated capacity claim. Use multiple servers, not one scene with 20,000 characters.
- Map-only fullscreen, desktop keyboard controls and touch controls.

## Stack and existing identity
Retain React 18, Vite, TypeScript, Three.js, Supabase, GitHub and Vercel from the existing project. Preserve the Trilha name, forest palette, cream surfaces and approachable Portuguese language.

## Constraints and current limits
The current realtime implementation targets a small pilot. It uses private Supabase channels, membership checks, server-controlled chat and room capacity. Movement and gestures are ephemeral client-reported cosmetic state; never use them to authorize rewards, purchases or VIP. Full load and mobile hardware performance remain unverified. Administration requires a verified owner email; no localStorage admin/VIP bypass.
