---
name: Trilha
description: A welcoming virtual camp in forest greens and cream.
colors:
  camp-ink: "#243e32"
  camp-mute: "#5e7164"
  camp-green: "#2b5542"
  camp-gold: "#bb8c4e"
  camp-paper: "#f5f3eb"
  camp-line: "#dbe0d3"
  warm-surface: "#fbfaf5"
  button-white: "#fff"
  secondary-text: "#36523c"
  secondary-line: "#bdc8b5"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(30px, 3vw, 49px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(24px, 2.2vw, 34px)"
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
rounded:
  field: "7px"
  button: "8px"
  navigation: "9px"
  map: "13px"
  dialog: "15px"
  portrait: "50%"
spacing:
  character-gap: "8px"
  button-gap: "9px"
  lobby-gap: "20px"
  desktop-content: "30px 32px 34px"
components:
  button-primary:
    backgroundColor: "{colors.camp-green}"
    textColor: "{colors.button-white}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "11px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "11px 16px"
---

# Design System: Trilha

## Overview

Trilha extends its established forest-and-cream identity into a shared virtual camp. Its visual character is approachable, quiet and outdoors-oriented: dark green typography, warm paper surfaces, leaf-toned selections and occasional gold details. The Portuguese interface treats walking, conversation and equipment as friendly camp activities.

This is a scan of the implemented lobby, not a new visual direction. The map is the immersive surface; surrounding navigation and people lists use restrained tonal separation and compact controls. No new creative metaphor or anti-reference has been introduced.

**Key Characteristics:**
- Forest greens over warm cream.
- Manrope headings with DM Sans supporting text.
- Soft rectangular controls and circular human portraits.
- Sparse shadows, with depth concentrated in transient overlays.
- Responsive map controls and persistent mobile navigation.

## Colors

The palette pairs woodland greens with warm neutral paper; the frontmatter records the reusable source values.

### Primary
- **Camp green:** filled primary actions.
- **Camp ink:** principal text and brand lettering.
- **Camp mute:** supporting copy and quieter metadata.

### Secondary
- **Camp gold:** existing accent variable; related ochre treatments distinguish VIP details, contextual interaction prompts and keyboard focus. These related treatments have their own literal CSS values rather than one unified gold ramp.

### Neutral
- **Camp paper:** application background.
- **Warm surface:** sidebar, header and mobile navigation.
- **Camp line:** dividers between persistent regions.
- **Button white:** contrast text on green actions.
- **Secondary text and line:** outlined secondary controls.

**The Forest and Paper Rule.** Extend the incumbent greens and cream surfaces when adding interface regions; preserve the Trilha identity established in PRODUCT.md.

## Typography

**Display Font:** Manrope, sans-serif fallback.
**Body Font:** DM Sans, sans-serif fallback.

Headings are compact, softly geometric and moderately weighted. Supporting information is smaller and deliberately quiet. No serif or monospaced role is established in the lobby.

### Hierarchy
- **Display:** arrival headline, with the responsive size and tracking in frontmatter. Arrival copy is (15px), line-height (1.9), with a (44ch) maximum width on desktop.
- **Headline:** page title, with its fluid desktop size in frontmatter; becomes (26px) at the mobile breakpoint and (24px) at the narrowest breakpoint.
- **Title:** arrival form and profile dialog titles. Smaller section titles use observed Manrope sizes from (15px) to (19px).
- **Body:** default interface text. Page descriptions use (13px) with line-height (1.6); map and people metadata frequently use (10px) or (11px).
- **Label:** primary and secondary button labels. Form labels use (11px), weight (600). Brand lettering is Manrope (31px), weight (800), tracking (-0.03em).

## Layout

Desktop uses a persistent sticky sidebar (224px), header (75px), and a flexible content column. The content inset is recorded in frontmatter. The lobby places the map beside a people rail (254px), separated by the lobby gap. Arrival content has a two-column layout with a maximum width (1120px); its copy and form are distinct regions.

Observed responsive thresholds:
- **At least 1650px:** content padding (40px 50px), people rail (290px), map height (70vh).
- **At most 1200px:** sidebar (190px), content padding (25px 23px), map and people rail stack; the people rail becomes two columns. Server and equipment grids use two columns.
- **At most 800px:** sidebar disappears; fixed bottom navigation replaces it. Header becomes (61px), content padding (24px 18px), and arrival becomes one column with maximum width (580px). The application reserves (65px) below content; bottom navigation also accounts for the safe-area inset. Map height becomes (65svh), minimum (440px).
- **At most 450px:** server, equipment and people layouts become single-column; profile dialog padding becomes (28px 20px).

The desktop map surface uses height (clamp(480px, 65vh, 800px)). Fullscreen applies to the map container: (100vw) by (100dvh), with its toolbar retained and the scene height reduced by (52px).

## Elevation & Depth

Persistent regions mainly use cream/green tonal layers and thin borders. The map is clipped within its rounded frame. Transient overlays receive stronger separation: a dark translucent forest scrim for profile dialogs, and shadows for map help and status toasts.

### Shadow Vocabulary
- **Map help:** (0 12px 40px #213b3440), lifting instructions above the scene.
- **Toast:** (0 8px 30px #23452a33), separating status feedback from the page.
- **Expanded field map:** (0 8px 30px #28412b30), lifting the readable location legend above the scene.

## Shapes

Controls use modest curved corners, with the observed radii in frontmatter. The map frame and help panel share their larger radius; profile dialogs are slightly softer. Portraits remain circular: regular portraits are (38px), expanded dialog portraits (85px). Selection is generally a leaf-toned fill or border rather than an additional shadow.

## Components

### Buttons
Primary actions are solid forest green with white text; secondary actions use transparent fill, green text and a thin muted green border. Both use centered inline icon/label composition, the frontmatter padding, and minimum height (43px).

Buttons transition background and color over (0.15s). Enabled hover applies brightness (0.96); disabled controls use opacity (0.58). Keyboard focus uses an ochre outline (3px solid #ac823e), offset (4px). Reduced-motion preference removes button transitions. Do not infer a spring, bounce or scale interaction from this implementation.

### Inputs / Fields
Arrival and admin fields have height (44px), curved field corners, padding (0 12px), a thin pale green stroke (#cbd4c0), and near-white green-tinted fill (#fbfcf7). Text uses camp ink; placeholder copy stays muted but visible. Inputs share the global focus-visible treatment.

### Navigation
Desktop navigation combines outline icons and sentence-case Portuguese labels. Rows have minimum height (46px), padding (13px 11px), and navigation corners. Active rows use a pale leaf fill (#e5ebdd) and darker green text (#254d39). At the mobile breakpoint, a fixed bottom bar uses icon-over-label controls with minimum size (68px by 40px), active darker text and weight (700).

### Map and field controls
The map has a dark forest toolbar, softly translucent paper captions and an optional paper field map. Toolbar buttons remain outlined and compact with minimum dimensions (32px). Nearby people appear as small cream controls; contextual place/pet interactions use warm ochre paper near the lower center. Gesture buttons below the scene expose Acenar, Celebrar and Sentar with a leaf-toned selected state. Equipment links return users to their kit.

The map is focusable and uses its own inset ochre focus outline. Map-only fullscreen removes the rounded frame; a fixed expanded fallback covers the viewport. Touch controls and keyboard control help belong to the scene rather than the persistent page navigation.

The equipped field map has a button with accessible expand/collapse labels and `aria-expanded`. Its compact mobile title, hint and letter markers use (10px) text; markers use camp ink on pale leaf (#d5dfbc). Expanding the card gives it width (min(330px, calc(100% - 30px))), padding (16px), warm paper fill (#fff9e8) and a lifted shadow. The expanded map is (180px) high, with letter markers (24px) across and text (12px). A full location legend pairs circular letter badges with names in (12px) text; a smaller explanation identifies the gold player-position dot. Movement pauses while the field map is expanded. This field-map expansion is separate from map-container fullscreen.

### People and profiles
The people rail uses circular portraits, nickname, optional club identification, and small presence dots. Clicking a person in the rail or selecting a player in the scene opens the same cream profile dialog. The dialog provides wave, server conversation, mute and report actions, with a top-right close button. Dialog behavior includes Escape dismissal and focus management in LobbyApp.tsx. Selected profiles pause the lobby scene.

### Cards / Containers
Server and equipment views pair illustrated scenes with concise labels and actions. Preserve these existing content relationships when extending them. The people rail is a lightly tinted supporting region, not a floating shadow card. Dialogs are centered with bounded height (90svh), scrolling when required; status feedback uses a compact dark green toast.

## Do's and Don'ts

### Do:
- **Do** preserve forest greens, warm paper surfaces, the Trilha name and approachable Portuguese labels.
- **Do** reuse the existing primary/secondary hierarchy and visible keyboard focus.
- **Do** maintain circular portraits and legible nickname/club identification.
- **Do** keep mobile navigation and map fullscreen behavior coherent with the existing breakpoints.
- **Do** retain reduced-motion handling for button transitions.

### Don't:
- **Don't** introduce an unrelated visual identity while extending this lobby.
- **Don't** describe payment preparation controls as active purchases; their disabled state is part of the implemented interface.
- **Don't** imply that documentation extraction verifies rendering, mobile hardware performance or runtime capacity.

Source evidence: PRODUCT.md, src/lobby/lobby.css, src/lobby/LobbyApp.tsx and src/lobby/LobbyWorld.tsx. This document records source inspection; no browser inspection was performed for this extraction.
