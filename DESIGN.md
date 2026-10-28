---
name: Trilha Expedition
description: An isometric shared camp with charcoal equipment surfaces and an olive field interface.
colors:
  camp-ink: "#e6e6d7"
  camp-mute: "#a8b5a6"
  camp-green: "#58794c"
  camp-gold: "#d2b274"
  camp-paper: "#202820"
  camp-line: "#3a4739"
  rail: "#171e19"
  header: "#1b241e"
  equipment-surface: "#2c3927"
  dialog-surface: "#2c382a"
  field-surface: "#1f2a20"
  field-text: "#eef0dd"
  field-line: "#5d7050"
  action-fill: "#728c53"
  action-ink: "#10190e"
  secondary-text: "#d7e3c8"
  secondary-line: "#71835d"
  belt-surface: "#1b281eea"
  slot-surface: "#2a3b27"
  slot-text: "#d1ddbe"
  slot-line: "#4c5f41"
  slot-selected: "#677646"
  slot-selected-text: "#fff4ca"
  slot-selected-line: "#d5c383"
  atlas-paper: "#e4e2c4"
  atlas-ink: "#263c2a"
  atlas-control: "#f2ecd4"
  atlas-action: "#364d2d"
  found-surface: "#3b4329"
  found-line: "#a89c60"
  card-line: "#536547"
  supporting-copy: "#bdccb0"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(30px, 3vw, 49px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "25px"
    fontWeight: 600
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  quickslot-label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "8px"
  quickslot-key:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "9px"
rounded:
  quickslot: "4px"
  atlas-control: "5px"
  scene-caption: "6px"
  field: "7px"
  panel: "8px"
  resource-hud: "9px"
  discovery: "14px"
  dialog: "15px"
  portrait: "50%"
spacing:
  belt-gap: "4px"
  belt-padding: "6px"
  action-gap: "9px"
  lobby-gap: "14px"
  menu-content: "26px"
  scene-content: "14px"
  collection-gap: "18px"
components:
  button-primary:
    backgroundColor: "{colors.action-fill}"
    textColor: "{colors.action-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.panel}"
    padding: "11px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.panel}"
    padding: "11px 16px"
  quickslot:
    backgroundColor: "{colors.slot-surface}"
    textColor: "{colors.slot-text}"
    rounded: "{rounded.quickslot}"
    padding: "12px 3px 5px"
  quickslot-selected:
    backgroundColor: "{colors.slot-selected}"
    textColor: "{colors.slot-selected-text}"
    rounded: "{rounded.quickslot}"
  discovery-card:
    backgroundColor: "{colors.equipment-surface}"
    textColor: "#e0e8cf"
    rounded: "{rounded.discovery}"
    padding: "24px"
  discovery-card-found:
    backgroundColor: "{colors.found-surface}"
    textColor: "#e0e8cf"
    rounded: "{rounded.discovery}"
    padding: "24px"
---

# Design System: Trilha Expedition

## Overview

The approved expedition direction uses Project Zomboid as its primary reference for isometric spatial readability, compact equipment controls and persistent world interaction. The implemented Trilha experience now frames the landscape with charcoal and dark olive surfaces. It keeps the Trilha name, Portuguese labels, Desbravadores context, human characters and optional club identification.

The scene dominates the first viewport. A narrow navigation rail and shallow server header support the world; a numbered equipment belt, resource readout, objective and compact atlas support exploration. Menus carry the same olive/charcoal language. Pale paper remains a purposeful contrast for the expanded atlas, help and contextual discoveries rather than the default application background.

This document records the current code after the authorized redesign. The Expedition redesign section of PRODUCT.md and the approved surface direction supersede the older cream-shell description retained elsewhere in PRODUCT.md. This extraction does not claim browser, performance or server-capacity verification.

**Key Characteristics:**
- Rotatable orthographic isometric camp and coherent terrain.
- Charcoal frame, olive equipment surfaces and pale readable text.
- Ten numbered quick slots with explicit selected states.
- A topographic waypoint atlas derived from the scene's data.
- Natural cave entrances, continuous covered galleries and a collision-constrained proximity camera.
- Sixteen preserved cosmetic discoveries with local collection progress.

## Colors

### Primary

- **Camp green:** the root green variable retained by supporting controls; primary action buttons use their distinct action-fill token.
- **Action fill and action ink:** pale olive actions with dark lettering, the implemented primary hierarchy.
- **Camp gold:** warm selection, navigation and objective emphasis.

### Neutral

- **Camp paper:** the charcoal application ground despite the inherited variable name.
- **Rail and header:** deeper enclosing surfaces with thin green-grey separators.
- **Camp ink and camp mute:** pale primary text and muted supporting text; the inherited ink token is now light.
- **Equipment and dialog surfaces:** dark olive menu cards, forms and profile dialogs.
- **Field surface, text and line:** recessed fields with light lettering and a visible green stroke.
- **Atlas paper and atlas ink:** warm topographic instrument with dark lettering.
- **Found surface and line:** muted olive-gold collection completion state.

**The Equipment Frame Rule.** Keep persistent application chrome dark. Use the pale atlas and contextual paper treatments where the current implementation gives them an orientation or interaction purpose.

## Typography

**Display Font:** Manrope, sans-serif fallback.
**Body Font:** DM Sans, sans-serif fallback.

The redesign retains the established type families and compresses the game chrome. Menu headings remain generously sized while equipment, navigation and map controls are compact. Icon labels, key numbers and explicit action wording carry meaning together.

### Hierarchy

- **Display:** arrival headline keeps the fluid Manrope scale in frontmatter and inherited responsive overrides; the redesigned arrival heading uses pale text.
- **Headline:** menu page heading uses the frontmatter role and becomes (25px) at most (800px). The world page heading is hidden so the landscape receives the space.
- **Title:** profile dialog and form headings retain the established Manrope role. Collection summary becomes (20px) on mobile.
- **Body:** default interface role; collection descriptions use (13px), line-height (1.65), and supporting copy in the collection summary uses line-height (1.7).
- **Label:** primary/secondary button labels remain (12px). Desktop rail labels use (10px); objective/resource copy uses (11px), reduced to (10px) on mobile.
- **Quickslot label and key:** the exact small equipment-label and key-number roles are recorded in frontmatter. Key numbers inherit the interface family rather than introducing a separate monospace face.

## Layout

Desktop shell: navigation rail (90px), flexible content, server header (52px). Menu content uses the frontmatter inset. In the active world, the heading/footer disappear and content inset tightens to (14px). The lobby pairs the scene with a people rail (210px) using the lobby gap; at least (1650px), the people rail is (240px). The scene toolbar is (46px), and its surface height is (calc(100svh - 175px)), minimum (460px).

At most (1100px), the shell rail contracts to (74px), the people rail stacks below the scene, and its content uses two columns. At most (800px), the sidebar disappears in favor of the existing fixed bottom navigation, the shell becomes a block layout, the header is (50px), menu inset is (22px 14px), and world inset is (8px). Mobile scene height is (calc(100svh - 180px)), minimum (510px); the people rail becomes a block. The mobile toolbar hides its leading location text to reserve controls space. Bottom navigation retains a safe-area-aware background and the application reserves (65px) for it.

The belt sits at the scene foot, centered on desktop and spanning left/right insets (10px) on mobile. It scrolls horizontally so all ten slots remain available. Desktop slots have fixed basis (52px), minimum height (62px); mobile slots use (45px) and (56px). The compact atlas is top-right: (155px) desktop, (104px) mobile. The expanded atlas is centered with width (min(720px, calc(100% - 28px))) and bounded scrolling. At least (700px), it becomes a two-column instrument: map column (minmax(220px, min(43vh, 440px))) and destination/detail column (240px), gaps (8px 14px), width max-content constrained by (calc(100% - 28px)). The detail column scrolls within (calc(43vh + 42px)); its destination buttons have minimum height (36px). Below that breakpoint the instrument stacks; inherited rules at most (650px) cap the canvas at (42vh).

Collection cards use three columns, gaps (18px), two columns at most (1000px), and one at most (600px). Summary controls wrap at the collection breakpoint. Fullscreen expands only the map container; the retained toolbar leaves scene height (calc(100dvh - 46px)).

The exploration area is (150×) the original, with the original-size camp at its center, ten outer destinations and sixteen preserved discovery IDs. The remapped region has sixteen shared paths, including four curved camp alleys, a connected valley circuit, two ridge ascents, a descending watercourse and approaches to two caves. Curved alleys and an irregular clearing replace the camp disc and central cross. Paths, water, cave plans, height sampling and forest positions supply both landscape and atlas rather than separate decorative maps.

## Elevation & Depth

The interface uses dark tonal layers, thin olive borders and restrained rounded panels. Resource HUD explicitly has no box-shadow. Scene-caption and objective backgrounds are translucent dark green, preserving the landscape context. The expanded atlas changes material to pale paper and lifts above scene controls; interaction prompts use a warm contrasting surface.

### Shadow Vocabulary

- **Expanded atlas:** (0 8px 30px #28412b30), inherited from the expanded-map container.
- **Discovery action:** (0 6px 24px #20352133), lifting the contextual collection prompt.
- **Map help:** (0 12px 40px #213b3440), retained help panel separation.
- **Status toast:** (0 8px 30px #23452a33), retained transient feedback.

Spatial depth primarily comes from the isometric orthographic world, lighting, overlapping foliage, slopes and intact cave cover. Near cave portals, shelters and canopies, the camera distance and lens interpolate continuously into a close perspective. A collision-constrained boom retracts from obstacles; leaving cover restores the selected outdoor isometric zoom. Roofs, walls and foliage remain rendered. Binocular use has its own first-person perspective lens.

## Shapes

Equipment slots use tight rectangular corners, inside a broader curved belt frame. Toolbar and atlas actions use small corners; map frame and people rail use the panel radius. Larger inherited dialog and discovery-card corners remain on supporting menu surfaces. Human portraits stay circular.

Caves have rough rock sidewalls following continuous curved gallery centerlines, a recessed floor and wider chamber. Their open stone arches merge into hillside cover. Entry brings the camera toward the character beneath the intact roof; rock walls retain their geometry and rendering. This implements the user's rejection of disconnected square-block caves through continuous spatial geometry rather than a new cave-themed UI card.

## Components

### Buttons and fields

Primary and secondary buttons retain minimum height (43px), centered icon/label alignment, gap (9px) and frontmatter padding. Primary buttons use olive fill with dark text; secondary buttons are transparent with pale text and an olive stroke. Enabled hover applies brightness (0.96); disabled controls use opacity (0.58). Background/color transitions last (0.15s); reduced-motion removes button transitions. Focus-visible retains an ochre outline (3px solid #ac823e), offset (4px).

Profile/arrival/admin fields are dark recessed surfaces with light text, height (44px), padding (0 12px), and field corners. Their placeholders are pale muted green (#acbda0). Profile dialogs preserve Escape dismissal and focus management.

### Navigation and people

The compact desktop rail stacks outline icons over labels; rows have minimum height (64px), with an olive fill and stroke for the selected destination. Lower profile identification is compact and club detail is not shown in the rail; the people panel still identifies connected visitors through portrait, nickname and club. Mobile navigation retains icon-over-label controls, selected warm text and the dark bar. Chat, server selection, kit, collection and VIP share olive menu surfaces.

### Quickbelt and resource HUD

Ten equipment slots correspond to keys **1–0**: Mapa de campo, Bicicleta, Companheiro, Lanterna, Cantil, Corda, Bússola, Binóculos, Botas and Capacete com luz. Slots expose full equipment names through aria-label/title as well as short visible text. `aria-pressed` indicates selected equipment; its olive fill, warm text and gold border distinguish it from other slots. The belt component toggles the selected item off when clicked again. Numeric keyboard shortcuts select the corresponding item while scene control is active.

Equipment is modeled as physical geometry attached to articulated hand, chest, head or foot sockets as appropriate. The pet moves independently through the world; a dismounted bicycle stays parked and requires approaching within (3m) to remount. The compass needle follows world north, lights follow their attached model, binoculars rise to the eyes, and fixed rope appears across the traversal. Detailed use gestures remain local; peers receive equipped items and basic poses.

Energy is shown as a percentage with a thin olive progress bar; the canteen reports doses out of three. Context-sensitive actions use **F** or a button to mount/dismount, drink, fix rope, observe, or switch a light. **G** or **Reabastecer cantil** refills near water. Drinking (1.5s) and refilling (1.8s) show progress, prevent repeated starts and commit once on completion. Walking or changing equipment cancels the water action without consumption; pausing suspends it. Full energy prevents unnecessary drinking. Running and cycling drain energy, rest restores it, and cave exploration requires walking. Light and cave-name copy explain interior conditions. Preserve these meaningful affordances rather than replacing them with decorative meters.

### Topographic atlas and waypoint

The map is available through its compact toggle and the **M** shortcut when the scene is focused. `aria-expanded` communicates its state. The expanded instrument supports drag panning, wheel or plus/minus zoom, **Minha posição**, **Toda a região**, and a scrollable destination index. It draws shared terrain heights and contour intervals (10m), trees, trails, the connected watercourse, cave galleries, crossing and camp features. A heading arrow, north mark, player marker, scale and legend explain orientation. Numbered destination marks retain a (20px) visible diameter in the expanded map with (44px) transparent hit targets, independent of zoom. At regional zoom below (2.5), central camp destinations collapse into the Acampamento marker; zooming in or using the index exposes individual places. Markers support Enter/Space selection and visible keyboard focus; the desktop destination list sits alongside the map.

Selecting a destination shows its distance and elevation. **Marcar destino** sets a waypoint, closes the atlas and returns focus to the scene. The objective then reads **Destino marcado**, shows name/distance and offers **Limpar destino**. Without a waypoint it shows **Próxima descoberta**. The atlas is a topographic map of the fictional scene; it is not a geographic map of Lapa. The older region/camp tab instrument has been replaced by this pan/zoom atlas.

### Collection and contextual discoveries

All **sixteen** discovery IDs remain intact. Collection cards display ordinal/rarity, award icon, name or **Ainda por descobrir**, story or hint, and a textual status. Pending cards use the dark equipment surface with dashed card-line borders; found cards use a solid gold-olive border and found-surface fill. **Siga a pista** and **Na sua coleção** distinguish state without color alone. Rarities remain **Comum**, **Incomum**, **Raro**. The summary shows count out of sixteen and accessible progress; browser-local identity-scoped storage remains explicit and awards no currency or VIP.

Near a collectible, a contrasting warm prompt exposes its name, **Recolher**, and **E ou toque aqui**. Cave collection requires an equipped, enabled light. Prompts and the belt are suppressed while the atlas is expanded, keeping orientation readable.

### Cave continuity and scene persistence

Two caves, Gruta dos Cristais and Caverna do Eco, use irregular continuous rock galleries and hillside entrances. Cave centerlines and shared height functions inform movement and atlas drawing. Entering triggers an ambient/sun/fog transition into the darker interior while cover detection, collision-constrained camera boom and continuous dolly/lens framing approach the character. Flashlight or headlamp supplies the exploration light. Roof visibility toggles, wall clipping and forest discard are absent; scenery remains rendered. This source documentation does not independently establish traversability or visual quality through browser testing.

Menu navigation retains the mounted scene in a hidden world panel and pauses scene interaction rather than remounting it. Position, energy, water, equipment-use state and scene-local waypoint remain in the current room's mounted session when returning from menus. The world is keyed by room ID; changing room or reloading is not the same persistence guarantee. Discovery collection separately persists in this browser for the authenticated identity.

## Do's and Don'ts

### Do:
- **Do** follow the approved Project Zomboid reference through isometric readability and compact equipment operation.
- **Do** retain charcoal/olive chrome, pale text and purposeful atlas paper.
- **Do** preserve all sixteen IDs, Portuguese names, club identification and current room/admin/VIP rules.
- **Do** keep cave entry, intact cover, proximity camera, movement and atlas geometry coherent.
- **Do** preserve the mounted room scene and pause interaction when opening menus.
- **Do** maintain visible focus, selected-state semantics and usable horizontally scrolling mobile equipment.

### Don't:
- **Don't** restore the stale cream application shell or the twelve-discovery count.
- **Don't** copy proprietary assets or add zombie/combat mechanics from the reference.
- **Don't** turn cave galleries into disconnected square-block assemblies.
- **Don't** imply that equipment trials or local collection are purchased entitlements.
- **Don't** describe source extraction as browser, hardware, authority or concurrency validation.

Source evidence: docs/map-camera.md; docs/item-interactions.md; PRODUCT.md; .impeccable/surfaces/expedition.md; src/lobby/expedition.css; src/lobby/lobby.css (inherited base); src/lobby/LobbyWorld.tsx; src/lobby/Quickbelt.tsx; src/lobby/exploration.ts; src/lobby/caverns.ts; src/lobby/FieldMap.tsx; src/lobby/coveredCamera.ts; src/lobby/equipment.ts; src/lobby/itemActions.ts; src/lobby/LobbyApp.tsx. expedition.css is imported after lobby.css and its current overrides define the documented shell. Source-only documentation refresh on 28 October 2026. Review images named mapa-*.png under .impeccable/review are SceneLab development fixtures, not production multiplayer proof; Seven local SceneLab development recaptures are complete, including the desktop atlas with its side index and the mobile atlas with direct selection of Gruta dos Cristais; these captures do not establish production behavior. No new product raster was generated for this documentation pass.

