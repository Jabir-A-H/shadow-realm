# Project Specification & Implementation Plan: Shadow Realm

A standalone cross-platform web and native RPG that unites the 13 battle-tested game engines from `personal-website` with the combat, shooter, and action mechanics designed in `F:\WebDev\Godot` (`gamepacks`, `nightblade`, `rogue-outlaw`, `reaction-time`).

The experience is structured as an expansive **2D Overworld RPG** (inspired by Google's *Doodle Champion Island Games*), framed with **Shadow Fight 2 prologue lore** (silhouette martial artists on living ink and watercolor wash), situated on a **Game of Thrones 7 Kingdoms–inspired vertical continental map**, and driven by a **Chromatic Metroidvania progression system** where defeating Wardens unlocks colors that reveal invisible paths, hidden shrines, and secret trials across the world.

---

## User Decisions Confirmed

> [!IMPORTANT]
> **Project Directory & Naming**:
> Target Directory: `f:\WebDev\shadow-realm`
>
> **License & IP Protection**:
> Proprietary / All Rights Reserved (Copyright © 2026 Jabir Abdullah Haian).
>
> **Newly Integrated High-Priority Action Engines (from `gamepacks`)**:
> 1. **Ma-ai (The Neutral)** *(Inspired by Footsies / Bushido Blade)*:
>    - A stripped-down, frame-tight 1D martial arts duel on a horizontal axis.
>    - Controls: Walk Forward/Back, Block, Quick Poke, Heavy Strike, Whiff Punish.
>    - First to land 3 clean unblocked strikes wins.
>    - **Role**: This will serve as the signature **1v1 Warden Boss Duel engine**!
> 2. **Ink Impact** *(Inspired by Nokia's Space Impact)*:
>    - Horizontal side-scrolling shooter with a monochrome sumi-e / shodo aesthetic on scrolling rice paper.
>    - Silhouette ronin / brush tip firing ink splatters, dodging abstract noise blocks & jagged ink blots.
>    - Powerups: Wide Brush (spread shot), Ink Shield (absorb hit).
>    - **Role**: High-speed aerial / naval skirmish trial in the High Vale or Drowned Isles.

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
| **The Frozen Reach** *(The North / The Wall)* | **The Frost King** *(Ice Lich)* | **Frost Cyan** (`#48cae4`) | **Ink Slide** (30 BFS ice-puzzle ruins) + **Ma-ai Duel** | *"Winter is Drawn."* |
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
│   ├── audio/                   # BGM, sword clashes, ink splash SFX
│   └── sprites/                 # Silhouette sprite sheets, tilemaps, parchment textures
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind v4 theme tokens & ink displacement filters
    ├── contexts/
    │   ├── SpectrumContext.tsx   # Manages unlocked colors & world perception state
    │   ├── SaveGameContext.tsx   # LocalStorage & optional Supabase cloud save
    │   └── AudioContext.tsx      # Web Audio API sound manager
    ├── components/
    │   ├── overworld/
    │   │   ├── OverworldCanvas.tsx # Kaplay.js / 2D Canvas tilemap mount
    │   │   ├── WorldMapModal.tsx   # Westeros-style parchment 7 Kingdoms map
    │   │   ├── DialogueOverlay.tsx # Silhouette portrait NPC dialogue
    │   │   └── BossIntroCutscene.tsx# Shadow Fight 2 style pre-duel clash screen
    │   ├── ui/
    │   │   ├── GreatScroll.tsx     # Trophy room & 7 Vermilion Seals status
    │   │   ├── QuickArcadeDrawer.tsx# Direct jump menu to any game or lobby
    │   │   └── HUD.tsx             # Active color gems, compass, pause menu
    │   └── games/                  # Ported & Themed Game Components
    │       ├── maai/               # Ma-ai (The Neutral) 1D Spacing Duel (Warden Clashes)
    │       ├── impact/             # Ink Impact (Space Impact-style horizontal ink shmup)
    │       ├── archery/            # Sky Cerulean Range (Yoichi's Peak)
    │       ├── uno/                # The Gilded Den (1v1, 6P Party, No Mercy)
    │       ├── fleet/              # Abyssal Navy Bay (Battleship vs AI/Online)
    │       ├── rush/               # River Crossings 2-lane reflex runner
    │       ├── slide/              # Frost Reach 30-level ice puzzles
    │       ├── bloom/              # Verdant Reach chain reaction garden
    │       ├── tictactoe/          # Scorched Dunes Gomoku/TTC
    │       ├── connect4/           # Red Viper's Gravity Grid
    │       ├── sudoku/             # Citadel 200 rated logic scrolls
    │       ├── memory/             # Archive speedrun glyph matching
    │       ├── outlaw/             # Top-down twin-stick badlands arena
    │       └── reaction/           # Bamboo grove quick-draw reflex test
    └── lib/
        ├── engine/
        │   ├── tilemapData.ts      # 7 Kingdoms tile coordinates & warp triggers
        │   ├── collision.ts        # Overworld obstacle & color-gate detection
        │   └── colorFilters.ts     # Canvas/SVG color tint shaders
        ├── games/                  # Shared game engines from personal-website
        │   ├── useArcadePeerRoom.ts# Supabase Realtime multiplayer engine
        │   ├── minimax.ts          # Connect-4 & Gomoku AI
        │   ├── slideSolver.ts      # BFS ice puzzle validator
        │   └── arcadeCrypto.ts     # Room IDs & crypto callsigns
        └── supabase.ts             # Supabase client config
```

---

## Phased Implementation Roadmap

### Phase 1: Project Scaffolding & Core Architecture
* Initialize standalone Vite + React 19 + TypeScript + Tailwind CSS project at `f:\WebDev\shadow-realm`.
* Configure Tailwind v4 with the sumi-e and 7-pigment design tokens.
* Set up `SpectrumContext` (managing Chapter 0 to 7, unlocked pigments, and world visibility masks).
* Scaffold the Capacitor (`android/`, `ios/`) and Tauri v2 (`src-tauri/`) wrappers.
* Create a master `SPEC.md` and `PLAN.md` in `shadow-realm` so any new IDE window or agent has full context.

### Phase 2: The 2D Overworld & 7 Kingdoms Map
* Implement `OverworldCanvas.tsx` using Kaplay.js / 2D Canvas:
  * Top-down 2D movement (WASD / Arrow keys + mobile on-screen joystick).
  * Smooth camera tracking centered on the Shadow Wanderer silhouette.
  * Tiled overworld layout shaped after the 7 Kingdoms.
* Add **Color-Gate Triggers**: Map entities that check `SpectrumContext` (e.g., cyan bridges only solid when Frost Cyan is unlocked).
* Add interactive NPC triggers with floating speech bubbles and silhouette portraits.

### Phase 3: Action Minigames Integration (High-Priority from GamePacks & Godot)
* **Ma-ai (The Neutral) 1D Martial Arts Canvas** (`src/components/games/maai/`):
  * 1D spacing duel inspired by *Footsies*.
  * Controls: Forward, Backward, Block, Quick Poke, Heavy Strike.
  * Whiff punishing, hit stun, brush stroke impacts, screen-shake.
  * First to 3 clean strikes wins. Serves as the signature Warden duel!
* **Ink Impact (Nokia Space Impact Shmup)** (`src/components/games/impact/`):
  * Side-scrolling ink shooter on textured rice paper background.
  * Thin fading brush projectiles, abstract noise obstacles, procedural ink blots.
  * Powerups: Wide Brush, Ink Shield.
* **Reaction-Time Quick-Draw** (`src/components/games/reaction/`):
  * "Ready... Set... Strike!" bamboo grove showdown measuring millisecond reflexes.
* **Rogue Outlaw Top-Down Arena** (`src/components/games/outlaw/`):
  * Top-down twin-stick / WASD + mouse shooter against bandit waves in the Scorched Dunes.

### Phase 4: Porting & Theming the Puzzle/Strategy Games
* Port the battle-tested game engines from `personal-website/components/games/` and `lib/games/`:
  * **Archery** → Reskinned with Sky Cerulean gale wind effects.
  * **Ink Fleet** → Reskinned with Abyssal Navy ocean mist + Supabase Realtime multiplayer.
  * **Uno** → Styled as The Gilded Vault's high-roller den with bot AI, custom presets, and multiplayer.
  * **Ink Slide** → Set in the Frost Reach with ice-cavern styling.
  * **Bloom** → Set in the Verdant Reach with blossoming organic seeds.
  * **Connect-4 / Gomoku / Sudoku / Memory** → Set in the Scorched Dunes and Citadel.
* Integrate victory condition callback: Beating a regional champion invokes the **Seal Stamping sequence** and unlocks the respective pigment in `SpectrumContext`.

### Phase 5: Polish, Audio, & Narrative Climax
* **Shadow Fight 2 Boss Encounter Screens**: Dramatic split-second silhouette clash animation with kanji/typography when challenging a Warden.
* **The Great Scroll**: Interactive parchment overlay displaying the 7 stamped Vermilion Seals, high score records, and unlocked lore fragments.
* **Quick Arcade Drawer**: Clean menu for players who want to jump directly into multiplayer Uno or Fleet with friends without walking the overworld.
* **Web Audio API**: Moody feudal Japanese ambient tracks, wind howling, bamboo flutes, and crisp ink/sword SFX.

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
1. **Overworld Traversal**: Verify smooth 60fps movement on both desktop (WASD) and mobile touch.
2. **Chromatic Progression**: Defeat Warden 1 (e.g. Frost King) → Confirm Frost Cyan unlocks → Confirm previously invisible ice bridges appear and allow crossing.
3. **Action Game Feel**: Verify frame-tight input responsiveness in *Ma-ai* (whiff punish timing) and *Ink Impact* (fluid projectile pooling).
4. **Multiplayer Room Sync**: Test Uno and Fleet room code sharing between two separate browser windows/devices via Supabase Realtime.
5. **Native Packaging**: Run `npx cap run android` on an Android emulator or connected device to verify full-screen touch responsiveness and haptics.
6. **Windows Binary**: Run `npx tauri build` and launch the output `.exe` to verify zero-lag offline launch.
