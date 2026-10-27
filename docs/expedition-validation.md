# Expedition validation — 27 October 2026

Base: bd956581f800ede43b5222ac7f466ccce27de1a4. Separate checkout retained the older task checkout untouched.

## Measured loading
Before (production Vite build): entry JS 466.61 kB / 132.28 kB gzip; entry CSS 62.20 kB / 14.10 kB gzip.
After implementation build: entry JS 426.57 kB / 123.77 kB gzip; entry CSS 47.53 kB / 10.68 kB gzip. Entry transfer is 6.4% smaller gzip JS and 24.3% smaller gzip CSS.
Club directory is lazy-loaded upon opening optional club identification. The original Lapa CSS is loaded with Lapa. No new dependency was added. The Three.js/physics shared chunk still exceeds Vite's advisory 500 kB threshold; splitting that file alone would not reduce the engine's total transfer.

## Runtime evidence
Before: 60 FPS, p95 16.8 ms, 90 calls, 131,980 triangles, 635×432 buffer at DPR .9.
After camp: 60 FPS, p95 16.8 ms, 109 calls, 115,658 triangles, 926×545 buffer at DPR 1. Different camera/framing/resolution prevent a direct FPS improvement claim. These are local browser samples, not physical-mobile or capacity benchmarks.
Camera no longer performs repeated terrain/tree ray-marching and mesh raycasts for ordinary isometric framing. Forest LOD follows the player rather than the distant orthographic camera. Terrain mesh density is reduced outside caves; cave tile density stays higher for cutaways. The atlas texture caches a 256px terrain image across mounts. Intersection/visibility observers stop RAF when the scene is hidden. Browser checked unchanged performance sample and position 11,-1 while collection was open; returning preserved bicycle and position.

## Functional verification
- check-motion.mjs: fixed-step movement at 30/60/144 Hz, jumping/landing, braking, pause, walls, bounds, spatial index and turning.
- check-expedition.mjs: all sixteen discovery IDs retained, bounds, two full cave entry/gallery/chamber/exit collision simulations, underground hill cover, open-face trail approach and cascade connected to river.
- Browser: numeric quick-slot key 2 equips bicycle; movement works with the new orientation; atlas selection marks Gruta dos Cristais and displays distance in HUD.
- Development-only SceneLab: crystal chamber detection, lantern off removes pickup, lantern on restores it, pickup raises collection count 0→1/16. Cave roof and upper rock walls cut away on entry. Fixture route excluded from production.
- No server schema, payment entitlement, moderation or admin rule was changed. Actual 20,000-user load and physical mobile GPU performance are outside this validation.

Additional browser checks: two independent authenticated guest identities appeared together in Araucária (ExploradorQA / TrilheiroMobile), 390px belt scroll and atlas were usable; prior chat history remained readable. No test chat message was sent.

Map-only fullscreen was also checked in the browser with the quickbelt, camera rotation and equipment actions retained. Detector returned no primary findings.
