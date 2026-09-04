# Shadow Realm — Technical Specification & Architecture

This document serves as the canonical technical reference for the **Shadow Realm** codebase.

---

## 1. Directory Structure

```
shadow-realm/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── capacitor.config.ts          # Android & iOS configuration
├── src-tauri/                   # Tauri v2 Windows EXE setup
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/                        # Architecture & design documents
├── public/
│   ├── audio/                   # Sound effects, ambient tracks, audio sprites
│   └── sprites/                 # Tilesets, Tiled-JSON maps, silhouette sheets, parchment textures
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind v4 theme tokens & ink displacement filters
    ├── contexts/
    │   ├── SpectrumContext.tsx   # Manages active pigments & world visibility masks
    │   ├── SaveGameContext.tsx   # Game progress, unlocked seals, local/cloud storage
    │   └── AudioContext.tsx      # Howler.js audio manager & sound effects triggers
    ├── components/
    │   ├── overworld/
    │   │   ├── PhaserOverworld.tsx # Phaser 3 container component with Tiled map loader
    │   │   ├── WorldMapModal.tsx   # Parchment 7 Kingdoms map
    │   │   ├── DialogueOverlay.tsx # Silhouette portrait NPC conversations (Motion)
    │   │   └── BossIntroCutscene.tsx# Shadow Fight 2 style pre-duel clash animation (Motion)
    │   ├── ui/
    │   │   ├── GreatScroll.tsx     # 7 Vermilion Seals status & trophy museum
    │   │   ├── QuickArcadeDrawer.tsx# Direct jump launcher for instant play / lobbies
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
    │           ├── bloom/          # Verdant Reach chain reaction garden
    │           ├── tictactoe/      # Scorched Dunes Gomoku/TTC
    │           ├── connect4/       # Red Viper's Gravity Grid (Minimax AI)
    │           ├── sudoku/         # Citadel 200 rated logic scrolls
    │           ├── memory/         # Archive speedrun glyph matching
    │           └── reaction/       # Bamboo grove quick-draw reflex test
    └── lib/
        ├── engine/
        │   ├── phaserConfig.ts     # Phaser 3 root configuration & scene registry
        │   ├── tilemapData.ts      # 7 Kingdoms continental coordinates & triggers
        │   └── colorFilters.ts     # Canvas/SVG color tint & ink displacement shaders
        ├── games/                  # Shared game engines from personal-website
        │   ├── useArcadePeerRoom.ts# Supabase Realtime multiplayer engine
        │   ├── minimax.ts          # Connect-4 & Gomoku AI
        │   ├── slideSolver.ts      # BFS ice puzzle validator
        │   └── arcadeCrypto.ts     # Room IDs & crypto callsigns
        └── audio/
            └── soundManager.ts     # Howler.js audio sprite map & mobile unlock
```

---

## 2. Core Systems & State Machines

### 2.1 SpectrumContext (The Chromatic Engine)
Manages the player's unlocked pigments and current perception tier:

```typescript
export type Pigment = 
  | 'frost-cyan'     // The Frozen Reach
  | 'abyssal-navy'   // The Drowned Isles
  | 'sky-cerulean'   // The High Vale
  | 'molten-gold'    // The Gilded Vault
  | 'emerald-jade'   // The Verdant Reach
  | 'rushing-teal'   // The River Crossings
  | 'blood-vermilion'// The Scorched Dunes
  | 'full-spectrum'; // The Obsidian Citadel

export interface SpectrumState {
  unlockedPigments: Set<Pigment>;
  activeOverlayColor: Pigment | null;
  unlockPigment: (pigment: Pigment) => void;
  hasPigment: (pigment: Pigment) => boolean;
}
```

### 2.2 Overworld-to-Minigame Transition Flow

1. Player approaches an Arena Gate or Warden Shrine on the overworld map (handled by Phaser 3 trigger zone).
2. An interaction prompt appears (`Press E or Tap to Challenge`).
3. Pressing interact triggers `BossIntroCutscene` (rendered by React + Motion):
   - Overworld Phaser scene pauses.
   - Screen dims with an ink splatter animation.
   - Dramatic 1v1 silhouette standoff with Japanese calligraphy titles (*"VS. THE FROST KING"*).
4. Minigame mounts:
   - If action-based (*Ma-ai*, *Ink Impact*): Phaser switches scene to the dedicated action game loop.
   - If strategy/card-based (*Uno*, *Connect-4*, *Slide*): React renders the UI game component.
5. On victory:
   - Vermilion Seal stamping sequence plays.
   - Corresponding pigment is added to `SpectrumContext`.
   - Overworld unpauses; newly unlocked environmental paths solidify in the Phaser tilemap.

### 2.3 Audio Architecture (Howler.js)
* All game audio is centralized through `src/lib/audio/soundManager.ts` using Howler.js.
* Audio sprites are used for rapid one-shot SFX (`sword-clash`, `ink-splash`, `whiff`, `block`, `card-slap`).
* Mobile touch automatically triggers `Howler.autoUnlock = true`, bypassing mobile browser autoplay restrictions cleanly.

### 2.4 Multiplayer Networking Architecture
* Built on **Supabase Realtime** (`broadcast` + `presence`).
* Zero database table writes required for real-time play; all game packets are ephemeral WebSocket broadcasts.
* Room codes are 4-character unambiguous uppercase strings (`generateRoomId`).
* 1-Click invite URLs formatted as `https://domain.com/duel?room=CODE&game=uno`.

---

## 3. Export Targets

* **Web**: Single Page Application built by Vite into `dist/`.
* **Android (APK/AAB)**: Capacitor configuration with Android hardware-accelerated WebView, fullscreen flags, and haptic feedback.
* **Windows (EXE)**: Tauri v2 configuration using Windows WebView2 runtime, compiling into a lightweight, self-contained desktop executable.
* **iOS (IPA)**: Capacitor iOS project with safe-area insets and touch-manipulation optimizations.
