# Project Specification & Implementation Plan: Shadow Realm

A standalone cross-platform web and native RPG that unites the 13 battle-tested game engines from `personal-website` with the combat, shooter, and action mechanics designed in `F:\WebDev\Godot` (`gamepacks`, `nightblade`, `rogue-outlaw`, `reaction-time`).

The experience is structured as an expansive **2D Overworld RPG** (inspired by Google's *Doodle Champion Island Games*), framed with **Shadow Fight 2 prologue lore** (silhouette martial artists on living ink and watercolor wash), situated on a **Game of Thrones 7 Kingdoms–inspired vertical continental map**, and driven by a **Chromatic Metroidvania progression system** where defeating Wardens unlocks colors that reveal invisible paths, hidden shrines, and secret trials across the world.

---

## User Decisions Confirmed & Library Architecture

> [!IMPORTANT]
> **Project Directory & Naming**:
> Target Directory: `f:\WebDev\shadow-realm`
>
> **License & IP Protection**:
> Proprietary / All Rights Reserved (Copyright © 2026 Jabir Abdullah Haian).

### 🛠️ System-by-System Library Stack (Constraint-Weighted)

Weighted for AI authorship reliability, web-first delivery, native wrapping (Capacitor/Tauri), Supabase Realtime multiplayer, and a clean split between physics/action games and UI/grid games:

| Subsystem | Primary Technology | Architecture Rationale |
| :--- | :--- | :--- |
| **Overworld & Tilemap** | **Phaser 3** | Massive AI training corpus, mature `Tilemap` / `Camera` / `Arcade Physics` APIs, and built-in Tiled-JSON import (`.tmx`/`.json`) for standard map generation without inventing bespoke schemas. |
| **Action & Physics Games** *(Ma-ai, Ink Impact, Rogue Outlaw, Ink Rush)* | **Phaser 3** | Single canvas stack sharing input, camera, and asset pipelines. Uses `Arcade Physics` for hitboxes, `Group`s for projectile pooling (Ink Impact), and frame-event state machines for hit-stun timing (Ma-ai). |
| **Card, Grid & Puzzle Games** *(Uno, Sudoku, Connect-4, Gomoku, Memory, Bloom, Slide, Mummy Maze)* | **Plain React 19 + Tailwind CSS** | No canvas engine overhead. Preserves clean DOM layouts, crisp text rendering, touch/mouse drag-and-drop, and accessibility. Directly ports the 13 already-working web games. |
| **Animation & Cutscenes** | **Motion** *(DOM)* + **Phaser Tweens** *(Canvas)* | **Motion** handles React-driven UI, dialogue modals, and screen transitions. Phaser's internal `Tween` manager handles in-scene canvas movements, keeping the two rendering layers cleanly separated. |
| **Audio & SFX** | **Howler.js** | Industry standard for cross-browser Web Audio with mobile audio-unlock handling and audio sprite support for instant one-shot sword clashes and ink splatter sounds. |
| **Multiplayer Networking** | **Supabase Realtime** | In-memory WebSocket broadcasts & presence. Zero DB writes; works identically from React state (Uno) or Phaser scenes (real-time duels). |
| **AI Opponents** | **Hand-Crafted TypeScript** | Zero external dependencies. Battle-tested minimax depth searches and BFS slide solvers running synchronously or in Web Workers. |
| **Native Export Pipeline** | **Capacitor** *(Android/iOS)* + **Tauri v2** *(Windows EXE)* | Clean wrapper architecture taking Vite's static `dist/` output with zero engine lock-in. |

---

## High-Priority Action Engines (from `gamepacks`)

1. **Ma-ai (The Neutral)** *(Inspired by Footsies / Bushido Blade)*:
   - A stripped-down, frame-tight 1D martial arts duel on a horizontal axis.
   - Built on a fixed-timestep loop in Phaser 3: Walk Forward/Back, Block, Quick Poke, Heavy Strike, Whiff Punish.
   - First to land 3 clean unblocked strikes wins.
   - **Role**: The signature **1v1 Warden Boss Duel engine**!
2. **Ink Impact** *(Inspired by Nokia's Space Impact)*:
   - Horizontal side-scrolling shooter with a monochrome sumi-e / shodo aesthetic on scrolling rice paper.
   - Built in Phaser 3 with projectile pooling (`Group`), abstract noise blocks, and procedural ink blots.
   - Powerups: Wide Brush (spread shot), Ink Shield (absorb hit).
   - **Role**: High-speed aerial / naval skirmish trial in the High Vale or Drowned Isles.

---

## World Architecture: The 7 Kingdoms & Chromatic Spectrum

### Lore Prologue (The Narrative Hook)
> *"In my hubris, I sought the ultimate mastery and shattered the Ancient Seal. The primordial ink surged forth, devouring the sun, dissolving my flesh into living shadow, and bleeding the realm dry of all light and color.*
>
> *The continent fractured into seven domains, each claimed by a powerful Warden who hoards one of the world's primordial pigments. Trapped as a silhouette, I must walk the Parchment Realm, conquer each Warden in their sacred trial, and stamp the Seven Vermilion Seals back into the Great Scroll to restore the stolen spectrum."*

### Continental Map & Regional Mapping

```
                         [THE FROZEN REACH / THE WALL]
                                (Frost Cyan)
                                     │
                            [THE DROWNED ISLES]
                               (Abyssal Navy)
                                     │
                           [THE RIVER CROSSINGS]
                               (Rushing Teal)
                               /            \
                 [THE GILDED VAULT]       [THE HIGH VALE]
                   (Molten Gold)           (Sky Cerulean)
                              \            /
                           [THE VERDANT REACH]
                             (Emerald Jade)
                                     │
                           [THE SCORCHED DUNES]
                            (Blood Vermilion)
```

| Region (GoT Parallels) | Warden & Title | Reclaimed Pigment | Games & Trials | Realm Motto (Easter Egg) |
| :--- | :--- | :--- | :--- | :--- |
| **The Frozen Reach** *(The North / The Wall)* | **The Frost King** *(Ice Lich)* | **Frost Cyan** (`#48cae4`) | **Ink Slide** (30 BFS ice puzzles) + **Ma-ai Duel** | *"Winter is Drawn."* |
| **The Drowned Isles** *(Iron Islands / Pyke)* | **Lord of the Kraken** | **Abyssal Navy** (`#1d3557`) | **Ink Fleet** (Naval combat with Supabase Realtime) | *"What is Sunk May Never Float."* |
| **The High Vale** *(The Eyrie / Vale of Arryn)*| **The Wind Hawk** | **Sky Cerulean** (`#90e0ef`) | **Archery** (Gale wind target range) + **Ink Impact** (Sky Shmup) | *"As High as the Arrow Flies."* |
| **The Gilded Vault** *(Westerlands / Lannister)*| **The Golden Patriarch** | **Molten Gold** (`#e0a96d`) | **Uno** (High-stakes card den, No Mercy, Stack wars) | *"A Warden Always Pays His Debt."* |
| **The Verdant Reach** *(Highgarden / Tyrell)* | **Lady of the Thorns** | **Emerald Jade** (`#2d6a4f`) | **Bloom (Chain Reaction)** (Explosive organic seed cascades) | *"Growing Explosions."* |
| **The River Crossings** *(Riverlands / Tully)* | **The Phantom Courier** | **Rushing Teal** (`#0077b6`) | **Ink Rush** (2-lane rapid reflex runner) + **Reaction-Time** (Quick-draw) | *"Family. Duty. Reflexes."* |
| **The Scorched Dunes** *(Dorne / Red Waste)* | **The Red Viper** | **Blood Vermilion** (`#b3312c`) | **Connect-4 & Gomoku** + **Rogue Outlaw** (Badlands top-down arena) | *"Unbowed. Unbent. Unbeaten."* |
| **The Obsidian Citadel** *(Oldtown / King's Landing)*| **The Grand Archivist** | **Full Spectrum Prism** | **Sudoku & Memory Flip** + Final Rift Gate Climax | *"Knowledge is Shadow."* |

---

## The Chromatic Metroidvania Engine

1. **Monochrome Opening (Chapter 0)**:
   - The world renders strictly in **2-tone Sumi-e** (Charcoal Black `#1a1a1a` on Aged Parchment `#f4ebd0`).
   - The player is a stark black silhouette. Most continental bridges and gates appear as crumbling chasms or impassable walls.
2. **Pigment Restoration**:
   - Defeating a Warden triggers a full-screen dynamic ink bloom cutscene unlocking that realm's color.
   - The color is permanently added to the player's active spectrum (`unlockedColors: Set<Color>`).
3. **Backtracking & Environmental Perception Shifts**:
   - **Frost Cyan**: Freezes raging waterfalls into solid climbing platforms; reveals hidden ice cavern trials in the North.
   - **Molten Gold**: Renders invisible gilded inscriptions and unlocks secret VIP doors leading to underground card speakeasies.
   - **Emerald Jade**: Reveals ancient living root ladders growing along cliff faces, granting vertical traversal.
   - **Abyssal Navy**: Parts supernatural ocean mists, enabling ferry passages between the mainland and the Drowned Isles.
   - **Sky Cerulean**: Reveals floating wind streams that allow gliding across canyon chasms.

---

## Proposed Project Structure

Target Repository: `f:\WebDev\shadow-realm`

```
shadow-realm/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── capacitor.config.ts          # Android & iOS native export configuration
├── src-tauri/                   # Windows EXE native configuration (Tauri v2)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/
│   ├── audio/                   # BGM, audio sprites for sword clashes & ink SFX
│   └── sprites/                 # Silhouette sprite sheets, Tiled JSON maps, parchment textures
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind v4 theme tokens & ink displacement filters
    ├── contexts/
    │   ├── SpectrumContext.tsx   # Manages unlocked colors & world perception state
    │   ├── SaveGameContext.tsx   # LocalStorage & optional Supabase cloud save
    │   └── AudioContext.tsx      # Howler.js audio manager & sound effects triggers
    ├── components/
    │   ├── overworld/
    │   │   ├── PhaserOverworld.tsx # Phaser 3 container component with Tiled map loader
    │   │   ├── WorldMapModal.tsx   # Westeros-style parchment 7 Kingdoms map
    │   │   ├── DialogueOverlay.tsx # Silhouette portrait NPC dialogue (Motion-animated)
    │   │   └── BossIntroCutscene.tsx# Shadow Fight 2 style pre-duel clash screen (Motion)
    │   ├── ui/
    │   │   ├── GreatScroll.tsx     # Trophy room & 7 Vermilion Seals status
    │   │   ├── QuickArcadeDrawer.tsx# Direct jump menu to any game or lobby
    │   │   └── HUD.tsx             # Active color gems, compass, pause menu
    │   └── games/                  # Game Modules (Phaser Action + React UI)
    │       ├── phaser/             # Phaser 3 Action Games
    │       │   ├── maai/           # Ma-ai (The Neutral) 1D Spacing Duel Scene
    │       │   ├── impact/         # Ink Impact Shmup Scene (Object pooling)
    │       │   ├── outlaw/         # Rogue Outlaw Top-Down Arena Scene
    │       │   └── rush/           # Ink Rush 2-Lane Reflex Runner Scene
    │       └── react/              # React 19 + Tailwind Puzzle / Board Games
    │           ├── uno/            # The Gilded Den (1v1, 6P Party, No Mercy, Supabase)
    │           ├── fleet/          # Abyssal Navy Bay (Battleship vs AI/Online)
    │           ├── archery/        # Sky Cerulean Range (Yoichi's Peak)
    │           ├── slide/          # Frost Reach 30-level ice puzzles
    │           ├── bloom/          # Verdant Reach chain reaction garden (CSS/Canvas bursts)
    │           ├── tictactoe/      # Scorched Dunes Gomoku/TTC
    │           ├── connect4/       # Red Viper's Gravity Grid (Minimax AI)
    │           ├── sudoku/         # Citadel 200 rated logic scrolls
    │           ├── memory/         # Archive speedrun glyph matching
    │           └── reaction/       # Bamboo grove quick-draw reflex test
    └── lib/
        ├── engine/
        │   ├── phaserConfig.ts     # Phaser 3 root config & scene registry
        │   ├── tilemapData.ts      # 7 Kingdoms tile coordinates & warp triggers
        │   └── colorFilters.ts     # SVG/Canvas ink bleed displacement filters
        ├── games/                  # Shared game engines from personal-website
        │   ├── useArcadePeerRoom.ts# Supabase Realtime multiplayer engine
        │   ├── minimax.ts          # Connect-4 & Gomoku AI
        │   ├── slideSolver.ts      # BFS ice puzzle validator
        │   └── arcadeCrypto.ts     # Room IDs & crypto callsigns
        └── audio/
            └── soundManager.ts     # Howler.js sound sprite map & mobile unlock
```

---

## Phased Implementation Roadmap

### Phase 1: Project Scaffolding & Core Architecture
* Initialize standalone Vite + React 19 + TypeScript + Tailwind CSS project at `f:\WebDev\shadow-realm`.
* Install and configure core libraries:
  * **Phaser 3** (`phaser`) for the overworld and action games.
  * **Motion** (`motion`) for React DOM animations, modals, and screen transitions.
  * **Howler.js** (`howler` + `@types/howler`) for audio sprites and mobile Web Audio unlocking.
  * **Supabase JS** (`@supabase/supabase-js`) for real-time multiplayer.
* Configure Tailwind v4 with the sumi-e and 7-pigment design tokens.
* Set up `SpectrumContext` (managing Chapter 0 to 7, unlocked pigments, and world visibility masks).
* Scaffold the Capacitor (`android/`, `ios/`) and Tauri v2 (`src-tauri/`) wrappers.

### Phase 2: The 2D Overworld & 7 Kingdoms Map (Phaser 3)
* Implement `PhaserOverworld.tsx` integrating Phaser 3 into React:
  * Tiled-JSON map loading for the 7 Kingdoms continent layout.
  * Smooth camera tracking centered on the Shadow Wanderer silhouette.
  * Top-down 2D movement (WASD / Arrow keys + mobile virtual joystick).
* Add **Color-Gate Triggers**: Map layers that check `SpectrumContext` (e.g., cyan bridges only solid when Frost Cyan is unlocked).
* Add interactive NPC triggers with floating speech bubbles and silhouette portraits using Motion overlays.

### Phase 3: Action Minigames Integration (Phaser 3 Canvas)
* **Ma-ai (The Neutral) 1D Martial Arts Canvas**:
  * 1D spacing duel inspired by *Footsies*.
  * Fixed-timestep loop: Forward, Backward, Block, Quick Poke, Heavy Strike, Whiff Punish.
  * Hit-stun timing via Phaser animation events, brush stroke impacts, screen-shake.
  * First to 3 clean strikes wins. Signature Warden duel!
* **Ink Impact (Nokia Space Impact Shmup)**:
  * Side-scrolling ink shooter on textured rice paper background.
  * Phaser `Group` projectile pooling, abstract noise obstacles, procedural ink blots.
  * Powerups: Wide Brush, Ink Shield.
* **Rogue Outlaw Top-Down Arena**:
  * Top-down twin-stick / WASD + mouse shooter against bandit waves in the Scorched Dunes.
* **Ink Rush**:
  * 2-lane reflex runner with fast hazard dodging.

### Phase 4: Porting & Theming the Puzzle/Strategy Games (React 19 + Tailwind)
* Port the battle-tested game engines from `personal-website`:
  * **Uno** → Styled as The Gilded Vault's high-roller den with bot AI, custom presets, and Supabase Realtime multiplayer.
  * **Ink Fleet** → Reskinned with Abyssal Navy ocean mist + Supabase Realtime multiplayer.
  * **Archery** → Reskinned with Sky Cerulean gale wind effects.
  * **Ink Slide** → Set in the Frost Reach with 30 BFS ice-cavern levels.
  * **Bloom** → Set in the Verdant Reach with blossoming organic seeds and lightweight DOM/Canvas particle bursts.
  * **Connect-4 / Gomoku / Sudoku / Memory / Reaction-Time** → Set in the Scorched Dunes and Citadel.
* Integrate victory condition callback: Beating a regional champion invokes the **Seal Stamping sequence** and unlocks the respective pigment in `SpectrumContext`.

### Phase 5: Polish, Audio & Narrative Climax (Motion + Howler)
* **Shadow Fight 2 Boss Encounter Screens**: Motion-powered dramatic split-second silhouette clash animation with kanji/typography when challenging a Warden.
* **The Great Scroll**: Interactive parchment overlay displaying the 7 stamped Vermilion Seals, high score records, and unlocked lore fragments.
* **Quick Arcade Drawer**: Clean menu for players who want to jump directly into multiplayer Uno or Fleet with friends without walking the overworld.
* **Howler.js Soundscape**: Feudal Japanese ambient tracks, wind howling, bamboo flutes, and crisp ink/sword SFX sprites.

### Phase 6: Multi-Platform Builds & Verification
* **Web**: Deploy to Vercel/Cloudflare; verify URL room-joining for multiplayer.
* **Android APK**: Build debug and release `.apk` via Capacitor Android.
* **Windows EXE**: Build standalone `.exe` via Tauri v2.
* **iOS**: Build Xcode project via Capacitor iOS.

---

## Verification Plan

### Automated Tests
- TypeScript compilation check: `npm run build`
- Vite linting & bundle analysis: `npm run lint`
- Game solver test suites: Verify BFS slide level solvers and minimax depth search remain performant without thread locking.

### Manual Verification
1. **Phaser Overworld Traversal**: Verify smooth 60fps movement on both desktop (WASD) and mobile touch.
2. **Chromatic Progression**: Defeat Warden 1 (e.g. Frost King) → Confirm Frost Cyan unlocks → Confirm previously invisible ice bridges appear and allow crossing.
3. **Action Game Feel**: Verify frame-tight input responsiveness in *Ma-ai* (whiff punish timing) and *Ink Impact* (fluid projectile pooling).
4. **Multiplayer Room Sync**: Test Uno and Fleet room code sharing between two separate browser windows/devices via Supabase Realtime.
5. **Howler Audio Unlock**: Verify audio plays cleanly on mobile browser touch without being blocked by autoplay policies.
6. **Native Packaging**: Run `npx cap run android` on an Android emulator or connected device to verify full-screen touch responsiveness and haptics.
7. **Windows Binary**: Run `npx tauri build` and launch the output `.exe` to verify zero-lag offline launch.
